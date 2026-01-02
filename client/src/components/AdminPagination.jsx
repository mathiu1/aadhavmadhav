import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AdminPagination = ({ page, pages, pageSize, setPage, setPageSize, pageSizeOptions = [5, 10, 20, 50] }) => {
    const [pageInput, setPageInput] = useState(page);

    useEffect(() => {
        setPageInput(page);
    }, [page]);

    const handleGoToPage = () => {
        const p = Number(pageInput);
        if (p >= 1 && p <= pages) {
            setPage(p);
        } else {
            setPageInput(page);
            toast.error(`Please enter a page between 1 and ${pages}`);
        }
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm mt-4">
            <div className="flex items-center gap-4 text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            if (setPageSize) {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }
                        }}
                        className="bg-slate-50 border-none rounded-lg font-bold text-slate-700 py-1 pl-2 pr-8 focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        disabled={!setPageSize}
                    >
                        {pageSizeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <span>Page {page} of {pages}</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <FiChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-slate-400 hidden sm:inline">Go to</span>
                    <input
                        type="number"
                        min="1"
                        max={pages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        className="w-16 bg-slate-50 border-none rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 p-2"
                    />
                    <button
                        onClick={handleGoToPage}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        Go
                    </button>
                </div>

                <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <FiChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default AdminPagination;
