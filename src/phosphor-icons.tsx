import type { SVGProps } from "react";

function spriteIcon(id: string) {
  return function PhosphorIcon({
    size = 24,
    ...props
  }: SVGProps<SVGSVGElement> & { size?: string | number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="currentColor"
        focusable="false"
        aria-hidden="true"
        {...props}
      >
        <use href={id} />
      </svg>
    );
  };
}

export const CheckIcon = spriteIcon("#icon-check");
export const SpinnerIcon = spriteIcon("#icon-progress-activity");
export const ArrowCircleUpRightIcon = spriteIcon("#icon-arrow-circle-up-right");
export const ArrowCounterClockwiseIcon = spriteIcon("#icon-restart-alt");
export const ArrowLeftIcon = spriteIcon("#icon-arrow-back");
export const BookIcon = spriteIcon("#icon-book-5");
export const BookOpenIcon = spriteIcon("#icon-menu-book");
export const BooksIcon = spriteIcon("#icon-library-books");
export const CalendarCheckIcon = spriteIcon("#icon-today");
export const CalendarDotsIcon = spriteIcon("#icon-event-note");
export const CalendarGridIcon = spriteIcon("#icon-calendar-view-month");
export const ColumnsIcon = spriteIcon("#icon-view-week");
export const CalendarIcon = spriteIcon("#icon-calendar");
export const CaretDownIcon = spriteIcon("#icon-caret-down");
export const CaretLeftIcon = spriteIcon("#icon-chevron-left");
export const CaretRightIcon = spriteIcon("#icon-chevron-right");
export const ChartBarIcon = spriteIcon("#icon-bar-chart");
export const ChartLineUpIcon = spriteIcon("#icon-calendar-analysis");
export const FloppyDiskIcon = spriteIcon("#icon-restore");
export const FireIcon = spriteIcon("#icon-local-fire-department");
export const FolderIcon = spriteIcon("#icon-folder");
export const GearSixIcon = spriteIcon("#icon-settings");
export const HeartIcon = spriteIcon("#icon-heart");
export const HourglassMediumIcon = spriteIcon("#icon-hourglass-pause");
export const LineVerticalIcon = spriteIcon("#icon-line-vertical");
export const MagnifyingGlassIcon = spriteIcon("#icon-search");
export const PauseIcon = spriteIcon("#icon-pause");
export const PlayIcon = spriteIcon("#icon-play-arrow");
export const PlusCircleIcon = spriteIcon("#icon-plus-circle");
export const QuestionIcon = spriteIcon("#icon-help");
export const RadioButtonIcon = spriteIcon("#icon-adjust");
export const RepeatIcon = spriteIcon("#icon-repeat");
export const ShuffleIcon = spriteIcon("#icon-shuffle");
export const SidebarSimpleIcon = spriteIcon("#icon-right-panel-close");
export const SkipBackIcon = spriteIcon("#icon-skip-previous");
export const SkipForwardIcon = spriteIcon("#icon-skip-next");
export const SpeakerHighIcon = spriteIcon("#icon-text-to-speech");
export const StackIcon = spriteIcon("#icon-stacks");
export const TrashIcon = spriteIcon("#icon-delete-outline");
