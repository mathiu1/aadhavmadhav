import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatCurrency';

// Local helper to avoid font issues with ₹ symbol in simple jsPDF
const formatCurrencyPdf = (amount) => {
    const val = Number(amount) || 0;
    const formatted = formatCurrency(val);
    return formatted.replace(/₹\s?/, 'Rs. ');
};

export const generateInvoice = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // -- Brand Colors --
    const primaryColor = [67, 56, 202]; // Indigo-700
    const secondaryColor = [30, 41, 59]; // Slate-800
    const lightGray = [241, 245, 249]; // Slate-100
    const white = [255, 255, 255];

    // -- Header Section --
    // Full width colored header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Logo / Brand Name (White text on blue background)
    doc.setFontSize(26);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text("AadhavMadhav", 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Premium E-Commerce Solutions", 20, 27);

    // Invoice Label (Right side of header)
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE", pageWidth - 20, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(order._id ? `#${order._id}` : 'N/A', pageWidth - 20, 28, { align: 'right' });

    // -- Info Section --
    const infoStartY = 70;

    // Left Column: Bill To
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("BILL TO", 20, infoStartY);

    doc.setFont('helvetica', 'normal');
    const billingY = infoStartY + 7;
    doc.text(order.user?.name || "Customer", 20, billingY);
    doc.text(order.shippingAddress?.address || "", 20, billingY + 5);
    doc.text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.postalCode || ''}`, 20, billingY + 10);
    doc.text(order.shippingAddress?.country || "India", 20, billingY + 15);
    doc.text(`Phone: ${order.shippingAddress?.phone || "N/A"}`, 20, billingY + 20);
    doc.text(order.user?.email || "", 20, billingY + 25);

    // Right Column: Order Meta
    const rightColX = pageWidth - 100;

    doc.setFont('helvetica', 'bold');
    doc.text("ORDER DETAILS", rightColX, infoStartY);

    doc.setFont('helvetica', 'normal');
    const metaY = infoStartY + 7;

    // Helper for key-value pairs
    const addMetaRow = (key, value, y) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        doc.text(key, rightColX, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text(value, pageWidth - 20, y, { align: 'right' });
    };

    addMetaRow("Order Date:", order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A', metaY);

    if (order.isDelivered && order.deliveredAt) {
        addMetaRow("Delivered On:", new Date(order.deliveredAt).toLocaleDateString('en-IN'), metaY + 7);
    }

    addMetaRow("Payment Method:", order.paymentMethod || 'N/A', metaY + 14);


    // -- Table --
    const tableStartY = 115;

    // Define footer function to be reused
    const addFooter = (docInstance, pageNumber, totalPages) => {
        const footerY = pageHeight - 20; // 20px from bottom

        docInstance.setDrawColor(241, 245, 249);
        docInstance.line(20, footerY - 10, pageWidth - 20, footerY - 10);

        docInstance.setFontSize(8);
        docInstance.setTextColor(150, 150, 150);

        // Left footer (Contact)
        docInstance.text("AadhavMadhav Inc.", 20, footerY);
        docInstance.text("support@aadhavmadhav.com | +91 8000 000 000", 20, footerY + 4);

        // Right footer (Page Num)
        docInstance.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
    };

    const tableBody = order.orderItems.map((item, index) => [
        index + 1,
        item.name,
        item.qty,
        formatCurrencyPdf(item.price),
        formatCurrencyPdf(item.price * item.qty)
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'ITEM DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
        body: tableBody,
        theme: 'plain',
        headStyles: {
            fillColor: lightGray,
            textColor: secondaryColor,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 6,
            halign: 'left'
        },
        bodyStyles: {
            textColor: secondaryColor,
            fontSize: 10,
            cellPadding: 6,
            lineColor: [241, 245, 249],
            lineWidth: { bottom: 0.1 }
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 35 },
            4: { halign: 'right', cellWidth: 35 }
        },
        // Ensure table allows page breaking
        pageBreak: 'auto',
        showHead: 'everyPage',
        margin: { bottom: 35 },
    });

    // -- Summary Section --
    let finalY = doc.lastAutoTable.finalY + 10;
    const summaryHeight = 45;

    // Check if summary fits on current page, if not add new page
    // Footer starts at pageHeight - 30, so ensure we have space before that
    if (finalY + summaryHeight > pageHeight - 40) {
        doc.addPage();
        finalY = 20; // Reset Y for new page
    }

    const summaryWidth = 80;
    const summaryX = pageWidth - summaryWidth - 20;

    // Background for summary
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(summaryX - 5, finalY - 5, summaryWidth + 10, summaryHeight, 2, 2, 'F');

    const addSummaryLine = (label, value, isBold = false, isBig = false) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(isBig ? 12 : 10);
        doc.setTextColor(...secondaryColor);

        doc.text(label, summaryX, finalY + 5);
        doc.text(value, pageWidth - 20, finalY + 5, { align: 'right' });
        finalY += isBig ? 12 : 8;
    };

    addSummaryLine("Items Subtotal:", formatCurrencyPdf(order.itemsPrice));
    addSummaryLine("Shipping Fee:", formatCurrencyPdf(order.shippingPrice));
    addSummaryLine("Tax Amount:", formatCurrencyPdf(order.taxPrice));

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(summaryX, finalY, pageWidth - 20, finalY);
    finalY += 5;

    // Total
    doc.setTextColor(...primaryColor);
    addSummaryLine("Grand Total:", formatCurrencyPdf(order.totalPrice), true, true);

    // -- Add Footers to All Pages --
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }

    // Download
    doc.save(`Invoice_${order._id ? order._id : 'AM'}.pdf`);
};
