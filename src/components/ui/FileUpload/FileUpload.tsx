import { useRef, useState, useCallback, type DragEvent } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    label?: string;
    files: File[];
    onChange: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // bytes
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
    label,
    files,
    onChange,
    accept,
    multiple = true,
    maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles) return;
            const validFiles = Array.from(newFiles).filter((f) => f.size <= maxSize);
            if (multiple) {
                onChange([...files, ...validFiles]);
            } else {
                onChange(validFiles.slice(0, 1));
            }
        },
        [files, onChange, multiple, maxSize]
    );

    const handleDrop = useCallback(
        (e: DragEvent) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const removeFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
    };

    return (
        <div className={styles['file-upload']}>
            {label && <span className={styles['file-upload__label']}>{label}</span>}

            <div
                className={`${styles['file-upload__dropzone']} ${dragging ? styles['file-upload__dropzone--dragging'] : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
            >
                <Upload size={24} className={styles['file-upload__icon']} />
                <span className={styles['file-upload__text']}>
                    <strong>Click to upload</strong> or drag and drop
                </span>
                <span className={styles['file-upload__hint']}>
                    Max {formatFileSize(maxSize)} per file
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {files.length > 0 && (
                <div className={styles['file-upload__list']}>
                    {files.map((file, i) => (
                        <div key={`${file.name}-${i}`} className={styles['file-upload__item']}>
                            <FileText size={18} className={styles['file-upload__item-icon']} />
                            <div className={styles['file-upload__item-info']}>
                                <div className={styles['file-upload__item-name']}>{file.name}</div>
                                <div className={styles['file-upload__item-size']}>{formatFileSize(file.size)}</div>
                            </div>
                            <button
                                type="button"
                                className={styles['file-upload__item-remove']}
                                onClick={() => removeFile(i)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
