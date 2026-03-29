"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";

const MERGE_TAGS = [
  { token: "{{contact.first_name}}", label: "First Name" },
  { token: "{{contact.last_name}}", label: "Last Name" },
  { token: "{{contact.email}}", label: "Email" },
  { token: "{{contact.company.name}}", label: "Company" },
  { token: "{{contact.company.industry}}", label: "Industry" },
  { token: "{{deal.name}}", label: "Deal Name" },
  { token: "{{deal.amount}}", label: "Deal Amount" },
  { token: "{{owner.full_name}}", label: "Sender Name" },
];

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Write your email..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-[120px] px-3 py-2 focus:outline-none text-[13px] text-zinc-200",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-white/[0.02]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.06] bg-white/[0.01]">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="size-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Merge tags */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-white/[0.06]">
        <span className="text-[10px] text-zinc-600 self-center mr-1">Insert:</span>
        {MERGE_TAGS.map((tag) => (
          <button
            key={tag.token}
            type="button"
            onClick={() => editor.chain().focus().insertContent(tag.token).run()}
            className="text-[10px] text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded px-1.5 py-0.5 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-white/[0.08] text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </button>
  );
}
