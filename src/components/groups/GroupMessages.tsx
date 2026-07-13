import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { listGroupMessages, postGroupMessage } from '@/services/groupService';
import { formatTime, toDateKey } from '@/utils/dates';
import type { GroupMessage } from '@/types/group';

const POLL_MS = 8000;

const dayFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

interface GroupMessagesProps {
  groupId: string;
  currentUserId: string | null;
}

/** Sección "Mensajes": chat persistente del grupo. */
export function GroupMessages({ groupId, currentUserId }: GroupMessagesProps) {
  const [messages, setMessages] = useState<GroupMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const refresh = () => {
    listGroupMessages(groupId)
      .then((rows) => {
        setMessages(rows);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes.'));
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Baja al final cuando llegan mensajes nuevos.
  useEffect(() => {
    if (!messages) return;
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      const container = scrollRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await postGroupMessage(groupId, text);
      setBody('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}

      <div
        ref={scrollRef}
        className="flex h-72 flex-col gap-2 overflow-y-auto rounded-xl bg-coffee-50/60 p-3"
      >
        {messages === null ? (
          <Spinner label="Cargando mensajes…" />
        ) : messages.length === 0 ? (
          <p className="m-auto text-sm text-coffee-400">
            Todavía no hay mensajes. ¡Escribe el primero!
          </p>
        ) : (
          messages.map((message, index) => {
            const mine = message.userId === currentUserId;
            const prev = messages[index - 1];
            const showDay = !prev || toDateKey(prev.createdAt) !== toDateKey(message.createdAt);
            return (
              <div key={message.id} className="flex flex-col gap-2">
                {showDay && (
                  <p className="my-1 text-center text-xs font-medium capitalize text-coffee-400">
                    {dayFormat.format(message.createdAt)}
                  </p>
                )}
                <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && (
                    <Avatar
                      user={{
                        displayName: message.displayName,
                        username: message.username,
                        avatarUrl: message.avatarUrl,
                      }}
                      className="size-7 text-[10px]"
                    />
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      mine
                        ? 'rounded-br-sm bg-coffee-600 text-white'
                        : 'rounded-bl-sm bg-white text-coffee-900 ring-1 ring-coffee-100'
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-xs font-semibold text-coffee-500">
                        {message.displayName || message.username}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                    <p
                      className={`mt-0.5 text-right text-[10px] tabular-nums ${
                        mine ? 'text-white/70' : 'text-coffee-300'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-end gap-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={500}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-coffee-200 bg-white px-3.5 py-2.5 text-base text-coffee-950 placeholder:text-coffee-300 transition-shadow focus:border-coffee-400 focus:shadow-[0_0_0_3px_rgba(156,111,68,0.15)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          aria-label="Enviar"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-coffee-600 text-white transition-colors hover:bg-coffee-700 active:bg-coffee-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
