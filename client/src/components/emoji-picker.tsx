import { useState, useRef, useEffect } from "react";
import EmojiPickerReact from "emoji-picker-react";
import { EmojiClickData } from "emoji-picker-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
}

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={pickerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {children}
      </div>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <EmojiPickerReact
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
          />
        </div>
      )}
    </div>
  );
}

export { EmojiPicker as default };