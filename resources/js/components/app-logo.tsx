import { Speech } from 'lucide-react';

export default function AppLogo() {
    return (
        <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-linear-150 from-[#00bba2] to-pink-300 text-primary-foreground flex items-center justify-center text-xs font-medium">
                <Speech width={15} />
            </div>
            <span className="ml-2 text-sm font-semibold transition-opacity duration-200">
                VisionAI
            </span>
        </div>
    );
}
