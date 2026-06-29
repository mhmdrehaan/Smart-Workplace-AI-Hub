"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function KnowledgeBasePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setStatus(null);
      } else {
        setStatus({ type: "error", message: "Maaf, saat ini hanya mendukung file format PDF." });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
  if (!file) return;
  setUploading(true);
  setStatus(null);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload gagal");
    }

    setStatus({
      type: "success",
      message: `Sukses! Dokumen "${file.name}" berhasil dipelajari oleh database AI.`,
    });
    setFile(null);
  } catch (error: any) {
    setStatus({
      type: "error",
      message: error.message || "Terjadi kesalahan saat upload.",
    });
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Upload dokumen atau regulasi tim (PDF). AI Agent akan membaca dan menjadikannya basis pengetahuan.
        </p>
      </div>

      <hr className="border-border" />

      {/* DRAG AND DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center transition-all ${
          isDragging 
            ? "border-primary bg-primary/5 scale-[0.99]" 
            : "border-muted-foreground/20 hover:border-primary/50"
        }`}
      >
        <div className="p-4 bg-muted rounded-full text-muted-foreground mb-4">
          <Upload className="h-8 w-8" />
        </div>
        
        <p className="font-medium text-lg">
          {file ? file.name : "Tarik & Lepas file PDF kamu di sini"}
        </p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          atau klik untuk menelusuri file dari laptop kamu
        </p>

        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className="px-4 py-2 border rounded-lg text-sm font-medium cursor-pointer bg-background hover:bg-muted transition"
        >
          Pilih File
        </label>
      </div>

      {/* ACTIONS & STATUS */}
      {file && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Sedang Memproses AI..." : "Proses Dokumen dengan AI"}
          </button>
        </div>
      )}

      {status && (
        <div className={`p-4 rounded-lg flex items-start space-x-3 border ${
          status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {status.type === "success" ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
          <div className="text-sm font-medium">{status.message}</div>
        </div>
      )}
    </div>
  );
}