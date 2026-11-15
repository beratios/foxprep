import { Logo } from "./Logo";
import { Barcode } from "./Barcode";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between bg-ink p-10 text-white md:flex">
        <Logo light />
        <div>
          <p className="wide text-[40px] font-black leading-[1.02]">Labeled, bagged, boxed and on the truck to Amazon.</p>
          <div className="mt-10 w-64 rounded-[3px] bg-white p-3"><Barcode value="FOXPREP-HAMILTON" height={40} className="w-full" /></div>
        </div>
        <p className="text-sm text-white/60">Hamilton, Ontario</p>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden"><Logo /></div>
          <h1 className="wide text-3xl font-black tracking-tight">{title}</h1>
          <p className="mb-8 mt-2 text-ink-soft">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
