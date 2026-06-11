import { useEffect, useState } from 'react';
import type { Example, Note } from '../types';

const DURATIONS = [
  '8t',
  '4t',
  '4n',
  '8n',
  '16n',
  '2n',
  '4n * 0.11',
  '4n * 0.25',
  '4n * 0.3',
] as const;

function cloneNotes(notes: Note[]): Note[] {
  return notes.map((n) => ({ ...n }));
}

interface ExampleEditorProps {
  example: Example;
  isCustomized: boolean;
  onClose: () => void;
  onSave: (notes: Note[], pickupBeat?: number) => void;
  onReset: () => void;
  onPlay: (notes: Note[], pickupBeat?: number) => void;
}

export default function ExampleEditor({
  example,
  isCustomized,
  onClose,
  onSave,
  onReset,
  onPlay,
}: ExampleEditorProps) {
  const [notes, setNotes] = useState<Note[]>(() => cloneNotes(example.notes));
  const [pickupBeat, setPickupBeat] = useState(
    example.pickupBeat !== undefined ? String(example.pickupBeat) : ''
  );

  useEffect(() => {
    setNotes(cloneNotes(example.notes));
    setPickupBeat(example.pickupBeat !== undefined ? String(example.pickupBeat) : '');
  }, [example]);

  const updateNote = (index: number, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note, i) => (i === index ? { ...note, ...patch } : note))
    );
  };

  const toggleRest = (index: number, rest: boolean) => {
    setNotes((prev) =>
      prev.map((note, i) =>
        i === index
          ? {
              ...note,
              rest,
              pitch: rest ? 'R' : note.pitch === 'R' ? 'C4' : note.pitch,
            }
          : note
      )
    );
  };

  const removeNote = (index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const addNote = () => {
    setNotes((prev) => [...prev, { pitch: 'C4', duration: '4t' }]);
  };

  const parsedPickup = pickupBeat.trim() === '' ? undefined : Number(pickupBeat);

  const handleSave = () => {
    onSave(notes, parsedPickup);
    onClose();
  };

  return (
    <div className="editor-backdrop" onClick={onClose} role="presentation">
      <div
        className="editor"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <header className="editor__header">
          <div>
            <p className="editor__eyebrow">{example.section}</p>
            <h2 id="editor-title">{example.label}</h2>
          </div>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="editor__pickup">
          <label>
            Pickup beat
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="none"
              value={pickupBeat}
              onChange={(e) => setPickupBeat(e.target.value)}
            />
          </label>
          <p className="editor__hint">Quarter-note offset before the first note (e.g. 3.67 = and of 4).</p>
        </div>

        <div className="editor__table-wrap">
          <table className="editor__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Rest</th>
                <th>Pitch</th>
                <th>Duration</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {notes.map((note, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(note.rest)}
                      onChange={(e) => toggleRest(i, e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="editor__pitch"
                      value={note.rest ? '' : note.pitch}
                      placeholder="R"
                      disabled={note.rest}
                      onChange={(e) => updateNote(i, { pitch: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="editor__duration"
                      list="duration-options"
                      value={note.duration}
                      onChange={(e) => updateNote(i, { duration: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => removeNote(i)}
                      aria-label={`Remove note ${i + 1}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="duration-options">
            {DURATIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>

        <button type="button" className="btn btn--ghost editor__add" onClick={addNote}>
          + Add note
        </button>

        <footer className="editor__footer">
          <div className="editor__footer-left">
            {isCustomized && (
              <button type="button" className="btn btn--ghost" onClick={onReset}>
                Reset to original
              </button>
            )}
          </div>
          <div className="editor__footer-right">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onPlay(notes, parsedPickup)}
            >
              Play
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
