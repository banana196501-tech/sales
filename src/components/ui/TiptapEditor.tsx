import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
    AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
    Code, Type, Palette, Undo, Redo, FileCode
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const TiptapEditor = ({ content, onChange, placeholder }: TiptapEditorProps) => {
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [htmlContent, setHtmlContent] = useState(content);

    const extensions = useMemo(() => {
        // Define all desired extensions
        const allExtensions = [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            TextStyle,
            Color,
            Highlight,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Start writing...',
            }),
        ];

        // Deduplicate at the top level to avoid immediate Tiptap warnings
        // if any overlapping extensions are accidentally included.
        const seen = new Set<string>();
        return allExtensions.filter(ext => {
            const name = (ext as any).name;
            if (name) {
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            }
            return true;
        });
    }, [placeholder]);

    const editor = useEditor({
        extensions,
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setHtmlContent(html);
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-4 focus:outline-none min-h-[150px] max-h-[300px] overflow-y-auto',
            },
        },
    });

    // Sync content if it changes from outside
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
            setHtmlContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const toggleHtmlMode = () => {
        if (isHtmlMode) {
            editor.commands.setContent(htmlContent);
        } else {
            setHtmlContent(editor.getHTML());
        }
        setIsHtmlMode(!isHtmlMode);
    };

    const MenuButton = ({ onClick, isActive = false, disabled = false, children, title }: any) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-md transition-colors ${isActive
                ? 'bg-blue-100 text-blue-600'
                : 'text-slate-600 hover:bg-slate-100'
                } disabled:opacity-30`}
        >
            {children}
        </button>
    );

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 border-b border-slate-200 p-1 flex flex-wrap gap-1">
                {!isHtmlMode ? (
                    <>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            isActive={editor.isActive('underline')}
                            title="Underline"
                        >
                            <UnderlineIcon className="w-4 h-4" />
                        </MenuButton>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                        <MenuButton
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            isActive={editor.isActive({ textAlign: 'left' })}
                            title="Align Left"
                        >
                            <AlignLeft className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            isActive={editor.isActive({ textAlign: 'center' })}
                            title="Align Center"
                        >
                            <AlignCenter className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            isActive={editor.isActive({ textAlign: 'right' })}
                            title="Align Right"
                        >
                            <AlignRight className="w-4 h-4" />
                        </MenuButton>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            title="Bullet List"
                        >
                            <List className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            title="Ordered List"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </MenuButton>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                        <MenuButton
                            onClick={() => {
                                const url = window.prompt('URL');
                                if (url) {
                                    editor.chain().focus().setLink({ href: url }).run();
                                }
                            }}
                            isActive={editor.isActive('link')}
                            title="Link"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            isActive={editor.isActive('heading', { level: 1 })}
                            title="Heading 1"
                        >
                            <span className="font-bold text-xs">H1</span>
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            isActive={editor.isActive('heading', { level: 2 })}
                            title="Heading 2"
                        >
                            <span className="font-bold text-xs">H2</span>
                        </MenuButton>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                        <MenuButton
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            title="Undo"
                        >
                            <Undo className="w-4 h-4" />
                        </MenuButton>
                        <MenuButton
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            title="Redo"
                        >
                            <Redo className="w-4 h-4" />
                        </MenuButton>
                    </>
                ) : (
                    <div className="flex items-center px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        HTML Source Mode
                    </div>
                )}
                <div className="flex-grow" />
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        toggleHtmlMode();
                    }}
                    className={`px-3 py-1 m-1 text-xs font-medium rounded-md transition-colors ${isHtmlMode
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    {isHtmlMode ? 'Back to Editor' : 'View HTML'}
                </button>
            </div>

            <div className="relative">
                {isHtmlMode ? (
                    <textarea
                        value={htmlContent}
                        onChange={(e) => {
                            setHtmlContent(e.target.value);
                            onChange(e.target.value);
                        }}
                        className="w-full h-[300px] p-4 font-mono text-sm bg-slate-900 text-slate-100 focus:outline-none resize-none"
                        spellCheck={false}
                    />
                ) : (
                    <div className="bg-white">
                        <EditorContent editor={editor} />
                    </div>
                )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between">
                <div className="flex gap-2">
                    {['{{name}}', '{{company}}', '{{email}}', '{{phone}}'].map(variable => (
                        <button
                            key={variable}
                            onClick={(e) => {
                                e.preventDefault();
                                if (isHtmlMode) {
                                    setHtmlContent(prev => prev + variable);
                                    onChange(htmlContent + variable);
                                } else {
                                    editor.chain().focus().insertContent(variable).run();
                                }
                            }}
                            className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        >
                            {variable}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                    Rich Text Editor Active
                </div>
            </div>
        </div>
    );
};

export default TiptapEditor;
