import { CircularProgress } from "@heroui/progress";

export function FullSizeLoader() {
    return (
        <div className="absolute flex items-center justify-center h-full w-full bg-gray-100 bg-opacity-40">
            <CircularProgress aria-label="in-progress" />
        </div>
    );
}