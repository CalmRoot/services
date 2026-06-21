import { useState, useEffect, useRef } from 'react';
import { X, Upload, MessageSquare, Send, Sparkles, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../lib/axios';

const ReportAnalyzer = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! Please upload your downloaded CalmRoot clinical report (PDF). I will parse the summary and answer any questions you have about your session or therapist notes! 🌿'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  
  const chatEndRef = useRef(null);

  // Load PDFJS dynamically
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      };
      document.body.appendChild(script);
    } else if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending]);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf') {
      setPdfError('Please upload a valid PDF file.');
      return;
    }

    setFile(uploadedFile);
    setLoadingPdf(true);
    setPdfError('');
    
    try {
      const text = await extractTextFromPDF(uploadedFile);
      setExtractedText(text);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ Successfully extracted clinical notes from "${uploadedFile.name}".\n\nI have summarized the report and am ready for your questions! What would you like to clarify?`
        }
      ]);
    } catch (err) {
      console.error('PDF parsing error:', err);
      setPdfError('Failed to read text from PDF. Make sure it is not password-protected.');
      setFile(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const extractTextFromPDF = async (pdfFile) => {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library is not loaded yet. Please try again.');
    }

    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
          let text = '';
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            text += `Page ${pageNum}:\n${pageText}\n\n`;
          }
          
          if (!text.trim()) {
            throw new Error('No text content found in the PDF.');
          }
          resolve(text);
        } catch (err) {
          reject(err);
        }
      };
      fileReader.onerror = () => reject(new Error('File reading failed'));
      fileReader.readAsArrayBuffer(pdfFile);
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !extractedText) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/api/wellness/analyze-report', {
        reportText: extractedText,
        question: userMessage
      });

      if (res.data.success) {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: res.data.data.response,
            model: res.data.data.model
          }
        ]);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '🌿 I ran into an issue analyzing the report text. Please make sure AWS Bedrock is configured properly and try again.'
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl border border-border flex flex-col h-[80vh] overflow-hidden text-text">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-alt">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Report Analyzer</h2>
              <p className="text-xs font-semibold text-muted tracking-wide">Sage RAG Support Bot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-colors text-muted hover:text-danger">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat / Upload Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col bg-bg/25">
          
          {/* Messages display */}
          <div className="space-y-4 flex-1">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-sm text-white ${
                  msg.role === 'user' 
                    ? 'bg-secondary' 
                    : 'bg-primary'
                }`}>
                  {msg.role === 'user' ? 'U' : 'S'}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white border-primary/20 rounded-tr-none' 
                    : 'bg-surface border-border text-text rounded-tl-none'
                }`}>
                  {msg.content}
                  {msg.model && (
                    <div className="text-[9px] opacity-40 font-mono mt-2 text-right">
                      Powered by {msg.model}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-white">S</div>
                <div className="bg-surface border border-border text-text rounded-tl-none rounded-2xl p-4 text-sm flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Upload Dropzone overlay if file not parsed yet */}
          {!extractedText && (
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-surface/50 flex flex-col items-center justify-center gap-4 transition-all hover:border-primary/50 relative">
              {loadingPdf ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-text">Parsing PDF report...</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text mb-1">Upload clinical report PDF</h4>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Select the clinical notes PDF report downloaded from your CalmRoot sessions.
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <button className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm pointer-events-none">
                    Select File
                  </button>
                </>
              )}
              {pdfError && <div className="text-xs font-bold text-danger mt-2">{pdfError}</div>}
            </div>
          )}

        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-border bg-surface-alt">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!extractedText || sending}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-bg/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 text-sm text-text"
              placeholder={extractedText ? "Ask Sage about your report..." : "Please upload your PDF report first..."}
            />
            <button 
              type="submit"
              disabled={!extractedText || sending || !input.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-md active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ReportAnalyzer;
