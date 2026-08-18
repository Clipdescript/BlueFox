import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  MdAutoAwesome,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdCropSquare,
  MdDeleteOutline,
  MdDraw,
  MdHighlight,
  MdPictureAsPdf,
  MdRedo,
  MdRefresh,
  MdSave,
  MdSearch,
  MdTextFields,
  MdUndo,
  MdZoomIn,
  MdZoomOut
} from 'react-icons/md';
import './pdf-editor.css';

GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_HISTORY = 60;
const DEFAULT_COLOR = '#2563eb';
const HIGHLIGHT_COLOR = '#facc15';
const TOOLS = [
  { id: 'select', label: 'Sélectionner', icon: MdCropSquare },
  { id: 'text', label: 'Ajouter du texte', icon: MdTextFields },
  { id: 'highlight', label: 'Surligner', icon: MdHighlight },
  { id: 'draw', label: 'Dessiner', icon: MdDraw },
  { id: 'rectangle', label: 'Rectangle', icon: MdCropSquare },
  { id: 'redact', label: 'Masquer du contenu', icon: MdDeleteOutline },
  { id: 'eraser', label: 'Supprimer une annotation', icon: MdDeleteOutline }
];

const toUint8Array = (data) => {
  if (!data) return null;
  if (data instanceof Uint8Array) return new Uint8Array(data);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (Array.isArray(data)) return new Uint8Array(data);
  if (data.type === 'Buffer' && Array.isArray(data.data)) return new Uint8Array(data.data);
  return null;
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const hexToRgb = (hex) => {
  const normalized = String(hex || DEFAULT_COLOR).replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized;
  const parsed = Number.parseInt(value, 16);
  if (!Number.isFinite(parsed)) return rgb(0.145, 0.388, 0.922);
  return rgb(((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255);
};

const getPoint = (event, element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height)
  };
};

const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim();

function PdfPage({
  pdfDocument,
  pageNumber,
  zoom,
  annotations,
  activeTool,
  selectedAnnotationId,
  onCreateAnnotation,
  onSelectAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  scrollRootRef
}) {
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const drawingRef = useRef(null);
  const [basePageSize, setBasePageSize] = useState({ width: 595, height: 842 });
  const [isNearViewport, setIsNearViewport] = useState(pageNumber === 1);
  const [draft, setDraft] = useState(null);
  const pageSize = { width: basePageSize.width * zoom, height: basePageSize.height * zoom };

  // Only keep pages close to the viewport rendered. This prevents a 300 or
  // 1000-page PDF from creating hundreds of canvases at the same time.
  useEffect(() => {
    const element = pageRef.current;
    const root = scrollRootRef?.current;
    if (!element) return undefined;
    if (!root || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsNearViewport(entry.isIntersecting);
    }, { root, rootMargin: '1000px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [scrollRootRef]);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!isNearViewport) {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        return;
      }

      const page = await pdfDocument.getPage(pageNumber);
      if (cancelled || !canvas) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: zoom });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const context = canvas.getContext('2d', { alpha: false });
      setBasePageSize({ width: baseViewport.width, height: baseViewport.height });
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      renderTask = page.render({
        canvasContext: context,
        viewport: page.getViewport({ scale: zoom * outputScale })
      });
      await renderTask.promise;
    };

    void render().catch((error) => {
      if (!cancelled && error?.name !== 'RenderingCancelledException') console.error('PDF render failed:', error);
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDocument, pageNumber, zoom, isNearViewport]);

  const finishDrawing = useCallback((event) => {
    const current = drawingRef.current;
    if (!current || !pageRef.current) return;
    drawingRef.current = null;
    pageRef.current.releasePointerCapture?.(event.pointerId);

    const points = current.points || [];
    const end = points[points.length - 1] || current.start;
    const x = Math.min(current.start.x, end.x);
    const y = Math.min(current.start.y, end.y);
    const width = Math.abs(end.x - current.start.x);
    const height = Math.abs(end.y - current.start.y);

    if (current.type === 'draw' && points.length > 1) {
      onCreateAnnotation({
        id: makeId(), page: pageNumber, type: 'draw', points, color: DEFAULT_COLOR, thickness: 2.5
      });
    } else if ((current.type === 'highlight' || current.type === 'rectangle' || current.type === 'redact') && width > 0.01 && height > 0.01) {
      onCreateAnnotation({
        id: makeId(),
        page: pageNumber,
        type: current.type,
        x,
        y,
        w: width,
        h: height,
        color: current.type === 'highlight' ? HIGHLIGHT_COLOR : current.type === 'redact' ? '#ffffff' : DEFAULT_COLOR
      });
    }
    setDraft(null);
  }, [onCreateAnnotation, pageNumber]);

  const handlePointerDown = (event) => {
    if (event.button !== 0 || !pageRef.current) return;
    if (event.target.closest('.pdf-annotation')) return;
    if (activeTool === 'select' || activeTool === 'eraser') return;

    const point = getPoint(event, pageRef.current);
    if (activeTool === 'text') {
      onCreateAnnotation({
        id: makeId(), page: pageNumber, type: 'text', x: point.x, y: point.y,
        w: 0.34, h: 0.07, text: 'Écrire ici', color: '#172033', fontSize: 16
      });
      return;
    }

    drawingRef.current = { type: activeTool, start: point, points: [point] };
    pageRef.current.setPointerCapture?.(event.pointerId);
    setDraft({ type: activeTool, start: point, end: point, points: [point] });
  };

  const handlePointerMove = (event) => {
    const current = drawingRef.current;
    if (!current || !pageRef.current) return;
    const point = getPoint(event, pageRef.current);
    current.points.push(point);
    setDraft({ type: current.type, start: current.start, end: point, points: [...current.points] });
  };

  const pageAnnotations = annotations.filter((annotation) => annotation.page === pageNumber);

  const draftStart = draft?.start;
  const draftEnd = draft?.end;
  const draftX = draftStart && draftEnd ? Math.min(draftStart.x, draftEnd.x) : 0;
  const draftY = draftStart && draftEnd ? Math.min(draftStart.y, draftEnd.y) : 0;
  const draftW = draftStart && draftEnd ? Math.abs(draftEnd.x - draftStart.x) : 0;
  const draftH = draftStart && draftEnd ? Math.abs(draftEnd.y - draftStart.y) : 0;

  return (
    <div
      ref={pageRef}
      className={`pdf-page ${activeTool !== 'select' ? 'pdf-page-drawing' : ''}`}
      style={{ width: pageSize.width, height: pageSize.height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrawing}
      onPointerCancel={finishDrawing}
    >
      <canvas ref={canvasRef} className="pdf-page-canvas" />
      <div className="pdf-annotation-layer" aria-label={`Annotations de la page ${pageNumber}`}>
        {pageAnnotations.map((annotation) => {
          const selected = annotation.id === selectedAnnotationId;
          if (annotation.type === 'draw') {
            return (
              <svg key={annotation.id} className={`pdf-drawing-overlay ${selected ? 'is-selected' : ''}`} viewBox="0 0 1 1" preserveAspectRatio="none" onPointerDown={(event) => { event.stopPropagation(); onSelectAnnotation(annotation.id); }}>
                <polyline points={annotation.points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={annotation.color} strokeWidth={annotation.thickness / 900} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
          }

          return (
            <div
              key={annotation.id}
              className={`pdf-annotation pdf-annotation-${annotation.type} ${annotation.coverOriginal ? 'pdf-annotation-cover-original' : ''} ${selected ? 'is-selected' : ''}`}
              style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%`, width: `${annotation.w * 100}%`, height: `${annotation.h * 100}%`, borderColor: annotation.color }}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (activeTool === 'eraser') onDeleteAnnotation(annotation.id);
                else onSelectAnnotation(annotation.id);
              }}
            >
              {annotation.type === 'text' && (
                <textarea
                  value={annotation.text}
                  aria-label="Texte de l’annotation"
                  spellCheck="false"
                  onChange={(event) => onUpdateAnnotation(annotation.id, { text: event.target.value })}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={{ color: annotation.color, fontSize: `${Math.max(10, annotation.fontSize * zoom)}px` }}
                />
              )}
            </div>
          );
        })}

        {draft && (draft.type === 'draw' ? (
          <svg className="pdf-drawing-overlay pdf-drawing-draft" viewBox="0 0 1 1" preserveAspectRatio="none">
            <polyline points={draft.points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={DEFAULT_COLOR} strokeWidth="0.003" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className={`pdf-annotation pdf-annotation-${draft.type} pdf-annotation-draft`} style={{ left: `${draftX * 100}%`, top: `${draftY * 100}%`, width: `${draftW * 100}%`, height: `${draftH * 100}%` }} />
        ))}
      </div>
      <span className="pdf-page-number">{pageNumber}</span>
    </div>
  );
}

function PdfThumbnail({ pdfDocument, pageNumber, rootRef, thumbnailRefs, isActive, hasSearchMatch, onClick }) {
  const thumbnailRef = useRef(null);
  const canvasRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(pageNumber === 1);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const element = thumbnailRef.current;
    const root = rootRef?.current;
    if (!element) return undefined;
    if (!root || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => setIsNearViewport(entry.isIntersecting), { root, rootMargin: '300px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootRef]);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const renderThumbnail = async () => {
      if (!isNearViewport) {
        if (canvasRef.current) {
          canvasRef.current.width = 0;
          canvasRef.current.height = 0;
        }
        setIsRendered(false);
        return;
      }

      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const viewport = page.getViewport({ scale: 0.12 });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({
        canvasContext: canvas.getContext('2d', { alpha: false }),
        viewport: page.getViewport({ scale: 0.12 * outputScale })
      });
      await renderTask.promise;
      if (!cancelled) setIsRendered(true);
    };

    void renderThumbnail().catch((error) => {
      if (!cancelled && error?.name !== 'RenderingCancelledException') console.error('PDF thumbnail render failed:', error);
    });
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDocument, pageNumber, isNearViewport]);

  return (
    <button
      ref={(element) => {
        thumbnailRef.current = element;
        if (element) thumbnailRefs.current.set(pageNumber, element);
        else thumbnailRefs.current.delete(pageNumber);
      }}
      type="button"
      className={`pdf-page-thumb ${isActive ? 'is-active' : ''} ${hasSearchMatch ? 'has-search-match' : ''}`}
      onClick={onClick}
    >
      <span className="pdf-page-thumb-sheet">
        <canvas ref={canvasRef} aria-label={`Aperçu de la page ${pageNumber}`} />
        {!isRendered && <span>{pageNumber}</span>}
      </span>
      <span>Page {pageNumber}</span>
    </button>
  );
}

function PdfEditor({ file, onOpenFoxy, aiInsertion }) {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [annotationsState, setAnnotationsState] = useState({ past: [], present: [], future: [] });
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(1.05);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPages, setSearchPages] = useState([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Résume ce document et propose les points importants à retenir.');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAiBusy, setIsAiBusy] = useState(false);
  const pageRefs = useRef(new Map());
  const pageThumbnailRefs = useRef(new Map());
  const pagesScrollRef = useRef(null);
  const pagesSidebarRef = useRef(null);
  const lastAiInsertionRef = useRef('');
  const pdfKey = `${file?.filePath || ''}:${file?.fileName || ''}`;

  const annotations = annotationsState.present;
  const fileName = file?.fileName || 'Document PDF';

  const commitAnnotations = useCallback((nextValue) => {
    setAnnotationsState((current) => {
      const next = typeof nextValue === 'function' ? nextValue(current.present) : nextValue;
      return {
        past: [...current.past, current.present].slice(-MAX_HISTORY),
        present: next,
        future: []
      };
    });
  }, []);

  const updateAnnotation = useCallback((id, patch) => {
    commitAnnotations((current) => current.map((annotation) => annotation.id === id ? { ...annotation, ...patch } : annotation));
  }, [commitAnnotations]);

  const deleteAnnotation = useCallback((id) => {
    commitAnnotations((current) => current.filter((annotation) => annotation.id !== id));
    setSelectedAnnotationId(null);
  }, [commitAnnotations]);

  const undo = useCallback(() => {
    setAnnotationsState((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setAnnotationsState((current) => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      return { past: [...current.past, current.present], present: next, future: current.future.slice(1) };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;
    setIsLoading(true);
    setError('');
    setStatus('');
    setPdfDocument(null);
    setPageCount(0);
    setAnnotationsState({ past: [], present: [], future: [] });
    setSelectedAnnotationId(null);
    setSearchPages([]);

    const load = async () => {
      try {
        let payload = file;
        if (!toUint8Array(payload?.data) && payload?.filePath) {
          payload = await window.electron?.loadPdf?.(payload.filePath);
        }
        const bytes = toUint8Array(payload?.data);
        if (!bytes) throw new Error('Impossible de lire les données de ce PDF.');

        // PDF.js peut transférer/détacher le buffer reçu pour son worker.
        // On garde donc une copie intacte pour pdf-lib lors de l’enregistrement.
        const sourceCopy = new Uint8Array(bytes);
        const viewerCopy = new Uint8Array(sourceCopy);
        loadingTask = getDocument({ data: viewerCopy });
        const document = await loadingTask.promise;
        if (cancelled) return;
        setSourceBytes(sourceCopy);
        setPdfDocument(document);
        setPageCount(document.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(`Ce PDF ne peut pas être ouvert : ${loadError.message || 'fichier invalide'}`);
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [pdfKey]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void savePdf();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key === 'Delete' && selectedAnnotationId) deleteAnnotation(selectedAnnotationId);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const scrollToPage = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    pageRefs.current.get(pageNumber)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    pageThumbnailRefs.current.get(currentPage)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentPage]);

  const createAnnotation = useCallback((annotation) => {
    commitAnnotations((current) => [...current, annotation]);
    setSelectedAnnotationId(annotation.id);
    setActiveTool(annotation.type === 'text' ? 'select' : activeTool);
  }, [activeTool, commitAnnotations]);

  const extractText = useCallback(async () => {
    if (!pdfDocument) return '';
    const chunks = [];
    let characterCount = 0;
    for (let index = 1; index <= pdfDocument.numPages && characterCount < 24000; index += 1) {
      const page = await pdfDocument.getPage(index);
      const content = await page.getTextContent();
      const pageText = `Page ${index}: ${(content.items || []).map((item) => item.str || '').join(' ')}`;
      chunks.push(pageText);
      characterCount += pageText.length;
    }
    return chunks.join('\n').slice(0, 24000);
  }, [pdfDocument]);

  const requestFoxy = useCallback(async () => {
    if (!pdfDocument || !onOpenFoxy) return;
    try {
      const text = await extractText();
      onOpenFoxy('Résume ce document PDF. Tu peux aussi proposer une modification si je te le demande.', text);
      setStatus('Foxy est ouvert avec le contenu du PDF.');
    } catch (requestError) {
      setError(`Impossible de préparer le PDF pour Foxy : ${requestError.message || 'erreur inconnue'}`);
    }
  }, [extractText, fileName, onOpenFoxy, pdfDocument]);

  const searchDocument = useCallback(async () => {
    const term = normalizeText(searchTerm).toLowerCase();
    if (!term || !pdfDocument) {
      setSearchPages([]);
      return;
    }
    const matches = [];
    for (let index = 1; index <= pdfDocument.numPages; index += 1) {
      const page = await pdfDocument.getPage(index);
      const content = await page.getTextContent();
      const text = (content.items || []).map((item) => item.str || '').join(' ').toLowerCase();
      if (text.includes(term)) matches.push(index);
    }
    setSearchPages(matches);
    if (matches[0]) scrollToPage(matches[0]);
  }, [pdfDocument, searchTerm, scrollToPage]);

  const askFoxy = async () => {
    if (!pdfDocument || isAiBusy) return;
    setIsAiBusy(true);
    setAiAnswer('');
    try {
      const text = await extractText();
      const result = await window.electron?.askAi?.(`${aiPrompt}\n\nContenu extrait du PDF :\n${text}`);
      if (!result?.ok) throw new Error(result?.error || 'Foxy ne peut pas répondre.');
      setAiAnswer(result.answer || 'Aucune réponse.');
    } catch (aiError) {
      setAiAnswer(`Erreur : ${aiError.message || 'Foxy est indisponible.'}`);
    } finally {
      setIsAiBusy(false);
    }
  };

  const insertTextAnnotation = useCallback((text) => {
    const cleanAnswer = String(text || '').replace(/[#*_`]/g, '').trim().slice(0, 1600);
    if (!cleanAnswer) return;
    const lines = cleanAnswer.match(/.{1,70}(?:\s|$)/g) || [cleanAnswer];
    const height = Math.min(0.62, Math.max(0.12, lines.length * 0.035));
    createAnnotation({
      id: makeId(), page: currentPage, type: 'text', x: 0.08, y: 0.1, w: 0.82, h: height,
      text: cleanAnswer, color: '#172033', fontSize: 14, coverOriginal: true
    });
  }, [createAnnotation, currentPage]);

  const insertAiAnswer = () => {
    if (!aiAnswer || aiAnswer.startsWith('Erreur :')) return;
    insertTextAnnotation(aiAnswer);
    setStatus('Réponse de Foxy ajoutée comme annotation.');
  };

  useEffect(() => {
    if (!aiInsertion?.id || aiInsertion.id === lastAiInsertionRef.current) return;
    lastAiInsertionRef.current = aiInsertion.id;
    insertTextAnnotation(aiInsertion.text);
    setStatus('Foxy a ajouté sa réponse dans le PDF.');
  }, [aiInsertion, insertTextAnnotation]);

  const savePdf = useCallback(async () => {
    if (!sourceBytes || isSaving) return;
    setIsSaving(true);
    setStatus('Préparation du PDF modifié…');
    setError('');
    try {
      const document = await PDFDocument.load(sourceBytes);
      const font = await document.embedFont(StandardFonts.Helvetica);

      annotations.forEach((annotation) => {
        const page = document.getPage(annotation.page - 1);
        if (!page) return;
        const { width, height } = page.getSize();
        const x = (annotation.x || 0) * width;
        const y = height - ((annotation.y || 0) + (annotation.h || 0)) * height;
        const annotationColor = hexToRgb(annotation.color);

        if (annotation.type === 'text') {
          if (annotation.coverOriginal) {
            page.drawRectangle({ x, y, width: (annotation.w || 0) * width, height: (annotation.h || 0) * height, color: rgb(1, 1, 1), opacity: 1, borderOpacity: 0 });
          }
          const fontSize = Math.max(8, Math.min(32, annotation.fontSize || 16));
          const lines = String(annotation.text || '').split('\n').slice(0, 40);
          lines.forEach((line, index) => {
            page.drawText(line.slice(0, 180), { x, y: height - (annotation.y || 0) * height - fontSize * 1.1 * (index + 1), size: fontSize, font, color: annotationColor });
          });
        }
        if (annotation.type === 'highlight') {
          page.drawRectangle({ x, y, width: (annotation.w || 0) * width, height: (annotation.h || 0) * height, color: annotationColor, opacity: 0.32, borderOpacity: 0 });
        }
        if (annotation.type === 'rectangle') {
          page.drawRectangle({ x, y, width: (annotation.w || 0) * width, height: (annotation.h || 0) * height, borderColor: annotationColor, borderWidth: 2, opacity: 0, borderOpacity: 0.95 });
        }
        if (annotation.type === 'redact') {
          page.drawRectangle({ x, y, width: (annotation.w || 0) * width, height: (annotation.h || 0) * height, color: rgb(1, 1, 1), opacity: 1, borderOpacity: 0 });
        }
        if (annotation.type === 'draw' && annotation.points?.length > 1) {
          for (let index = 1; index < annotation.points.length; index += 1) {
            const start = annotation.points[index - 1];
            const end = annotation.points[index];
            page.drawLine({
              start: { x: start.x * width, y: height - start.y * height },
              end: { x: end.x * width, y: height - end.y * height },
              thickness: annotation.thickness || 2,
              color: annotationColor
            });
          }
        }
      });

      const bytes = await document.save();
      const saved = await window.electron?.savePdf?.({ data: bytes, suggestedName: fileName });
      if (saved) setStatus(`PDF enregistré : ${saved.fileName}`);
      else setStatus('Enregistrement annulé.');
    } catch (saveError) {
      setError(`Impossible d’enregistrer le PDF : ${saveError.message || 'erreur inconnue'}`);
    } finally {
      setIsSaving(false);
    }
  }, [annotations, fileName, isSaving, sourceBytes]);

  const pageButtons = useMemo(() => Array.from({ length: pageCount }, (_, index) => index + 1), [pageCount]);

  return (
    <section className="pdf-editor" aria-label="Éditeur PDF BlueFox">
      <header className="pdf-editor-header">
        <div className="pdf-editor-title-wrap">
          <div className="pdf-editor-file-icon" aria-hidden="true"><MdPictureAsPdf /></div>
          <div className="min-w-0">
            <h1 title={fileName}>{fileName}</h1>
            <p>{pageCount ? `${pageCount} page${pageCount > 1 ? 's' : ''}` : 'Document PDF'}</p>
          </div>
        </div>
        <div className="pdf-powered-by" aria-label="powered by FoxyPDF">
          <span>powered by</span> <strong>FoxyPDF</strong>
        </div>
        <div className="pdf-editor-header-actions">
          <button type="button" className="pdf-ai-toggle-button" onClick={() => void requestFoxy()} disabled={!pdfDocument} aria-label="Ouvrir Foxy pour ce PDF" title="Demander à Foxy"><MdAutoAwesome /><span>Demander à Foxy</span></button>
          <button type="button" className="pdf-save-button" onClick={() => void savePdf()} disabled={isSaving || isLoading}><MdSave />{isSaving ? 'Enregistrement…' : 'Enregistrer sous'}</button>
        </div>
      </header>

      <div className="pdf-editor-toolbar">
        <div className="pdf-tool-group">
          {TOOLS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`pdf-tool-button ${activeTool === id ? 'is-active' : ''}`} onClick={() => setActiveTool(id)} aria-label={label} title={label} disabled={isLoading}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="pdf-toolbar-divider" />
        <button type="button" className="pdf-icon-button" onClick={undo} disabled={!annotationsState.past.length} aria-label="Annuler"><MdUndo /></button>
        <button type="button" className="pdf-icon-button" onClick={redo} disabled={!annotationsState.future.length} aria-label="Rétablir"><MdRedo /></button>
        <div className="pdf-toolbar-divider" />
        <button type="button" className="pdf-icon-button" onClick={() => setZoom((value) => Math.max(0.55, Number((value - 0.1).toFixed(2))))} aria-label="Réduire le zoom"><MdZoomOut /></button>
        <span className="pdf-zoom-label">{Math.round(zoom * 100)}%</span>
        <button type="button" className="pdf-icon-button" onClick={() => setZoom((value) => Math.min(2.4, Number((value + 0.1).toFixed(2))))} aria-label="Augmenter le zoom"><MdZoomIn /></button>
      </div>

      <div className="pdf-editor-body">
        <aside ref={pagesSidebarRef} className="pdf-pages-sidebar" aria-label="Pages du PDF">
          <div className="pdf-sidebar-heading">Pages</div>
          <div className="pdf-page-list">
            {pdfDocument && pageButtons.map((pageNumber) => (
              <PdfThumbnail
                key={pageNumber}
                pdfDocument={pdfDocument}
                pageNumber={pageNumber}
                rootRef={pagesSidebarRef}
                thumbnailRefs={pageThumbnailRefs}
                isActive={currentPage === pageNumber}
                hasSearchMatch={searchPages.includes(pageNumber)}
                onClick={() => scrollToPage(pageNumber)}
              />
            ))}
          </div>
        </aside>

        <div className="pdf-editor-workspace">
          <div className="pdf-workspace-topline">
            <div className="pdf-search-box">
              <MdSearch />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void searchDocument(); }} placeholder="Rechercher dans le PDF" aria-label="Rechercher dans le PDF" />
              <button type="button" onClick={() => void searchDocument()} disabled={!searchTerm} aria-label="Lancer la recherche"><MdSearch /></button>
            </div>
            {searchPages.length > 0 && <span className="pdf-search-result">{searchPages.length} page{searchPages.length > 1 ? 's' : ''}</span>}
            <div className="pdf-page-navigation">
              <button type="button" onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} aria-label="Page précédente"><MdChevronLeft /></button>
              <span>{currentPage} / {pageCount || '—'}</span>
              <button type="button" onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))} disabled={!pageCount || currentPage >= pageCount} aria-label="Page suivante"><MdChevronRight /></button>
            </div>
          </div>

          <div ref={pagesScrollRef} className="pdf-pages-scroll" onScroll={(event) => {
            const visible = [...pageRefs.current.entries()].find(([, element]) => {
              if (!element) return false;
              const rect = element.getBoundingClientRect();
              const container = event.currentTarget.getBoundingClientRect();
              return rect.top >= container.top - 120 && rect.top <= container.top + 180;
            });
            if (visible) setCurrentPage(visible[0]);
          }}>
            {isLoading && <div className="pdf-editor-empty"><MdRefresh className="pdf-spin" /><p>Ouverture de {fileName}…</p></div>}
            {error && <div className="pdf-editor-empty pdf-editor-error"><p>{error}</p></div>}
            {!isLoading && !error && pdfDocument && pageButtons.map((pageNumber) => (
              <div key={pageNumber} ref={(element) => { if (element) pageRefs.current.set(pageNumber, element); else pageRefs.current.delete(pageNumber); }} className="pdf-page-holder">
                <PdfPage
                  pdfDocument={pdfDocument}
                  pageNumber={pageNumber}
                  zoom={zoom}
                  annotations={annotations}
                  activeTool={activeTool}
                  selectedAnnotationId={selectedAnnotationId}
                  onCreateAnnotation={createAnnotation}
                  onSelectAnnotation={setSelectedAnnotationId}
                  onUpdateAnnotation={updateAnnotation}
                  onDeleteAnnotation={deleteAnnotation}
                  scrollRootRef={pagesScrollRef}
                />
              </div>
            ))}
          </div>
          {status && <div className="pdf-status-message" role="status">{status}</div>}
        </div>

        {isAiOpen && (
          <aside className="pdf-ai-panel" aria-label="Foxy pour le PDF">
            <div className="pdf-ai-heading"><div><MdAutoAwesome /><strong>Foxy PDF</strong></div><button type="button" onClick={() => setIsAiOpen(false)} aria-label="Fermer Foxy"><MdClose /></button></div>
            <p className="pdf-ai-intro">Analyse le texte du document, puis ajoute la réponse comme annotation si tu le souhaites.</p>
            <textarea className="pdf-ai-prompt" value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} aria-label="Question à Foxy" />
            <button type="button" className="pdf-ai-ask" onClick={() => void askFoxy()} disabled={isAiBusy || !pdfDocument}><MdAutoAwesome />{isAiBusy ? 'Analyse en cours…' : 'Demander à Foxy'}</button>
            {aiAnswer && <div className="pdf-ai-answer"><p>{aiAnswer}</p>{!aiAnswer.startsWith('Erreur :') && <button type="button" onClick={insertAiAnswer}>Insérer dans le PDF</button>}</div>}
          </aside>
        )}
      </div>
    </section>
  );
}

export default PdfEditor;
