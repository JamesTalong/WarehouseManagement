import ReactDOM from "react-dom";
import { ClipLoader } from "react-spinners";

const Loader = () => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <ClipLoader size={48} color="#38bdf8" />
        <p className="text-slate-200 text-sm tracking-wide">
          Processing warehouse data...
        </p>
      </div>
    </div>,
    document.getElementById("loader")
  );
};

export default Loader;
