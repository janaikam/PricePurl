import { useState } from 'react';
import PriceHistoryChart from './PriceHistoryChart';
import { derivePriceStatus, parsePriceValue } from '../priceHistory';

const sectionStyle = {
  border: '1px solid var(--border-subtle)',
  borderRadius: '18px',
  padding: '18px',
  backgroundColor: 'var(--surface-card)',
  boxShadow: 'var(--shadow-soft)'
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return 'Not available';
  }

  return new Date(timestamp).toLocaleString();
};

const projectNoteDisplayStyle = {
  margin: 0,
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--surface-subtle)',
  color: 'var(--text-primary)',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap'
};

const YarnDetail = ({
  yarn,
  onBack,
  onRefresh,
  onAddManualPrice,
  onUpdateRegularPrice,
  onSaveProjectNote,
  onDeleteProjectNote,
  onMarkPurchased,
  onRestore,
  onDelete
}) => {
  const [manualPrice, setManualPrice] = useState('');
  const [manualError, setManualError] = useState('');
  const [regularPrice, setRegularPrice] = useState(yarn.regularPrice || '');
  const [regularPriceError, setRegularPriceError] = useState('');
  const [projectNote, setProjectNote] = useState(yarn.projectNote || '');
  const [projectNoteError, setProjectNoteError] = useState('');
  const [isEditingProjectNote, setIsEditingProjectNote] = useState(false);
  const { isOnSale, isAtHistoricalLow } = derivePriceStatus(yarn);

  const handleDelete = () => {
    const confirmed = window.confirm('Delete this yarn permanently? This cannot be undone.');
    if (confirmed) {
      onDelete(yarn.id);
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setManualError('');

    if (!manualPrice.trim()) {
      setManualError('Enter a price to record.');
      return;
    }

    if (parsePriceValue(manualPrice) === null) {
      setManualError('Enter a valid price such as 5.49 or $5.49.');
      return;
    }

    const didSave = await onAddManualPrice(yarn.id, manualPrice);
    if (didSave) {
      setManualPrice('');
    }
  };

  const handleRegularPriceSubmit = async (event) => {
    event.preventDefault();
    setRegularPriceError('');

    if (!regularPrice.trim()) {
      setRegularPriceError('Enter a regular price to save.');
      return;
    }

    if (parsePriceValue(regularPrice) === null) {
      setRegularPriceError('Enter a valid regular price such as 7.99 or $7.99.');
      return;
    }

    const didSave = await onUpdateRegularPrice(yarn.id, regularPrice);
    if (!didSave) {
      setRegularPriceError('Could not save the regular price.');
    }
  };

  const handleProjectNoteSubmit = async (event) => {
    event.preventDefault();
    setProjectNoteError('');

    if (!projectNote.trim()) {
      setProjectNoteError('Write a note before saving, or delete the note instead.');
      return;
    }

    const didSave = await onSaveProjectNote(yarn.id, projectNote);
    if (didSave) {
      setProjectNote(projectNote.trim());
      setIsEditingProjectNote(false);
    } else {
      setProjectNoteError('Could not save the project note.');
    }
  };

  const handleDeleteProjectNote = async () => {
    const confirmed = window.confirm('Delete this project note?');
    if (!confirmed) {
      return;
    }

    setProjectNoteError('');
    const didDelete = await onDeleteProjectNote(yarn.id);

    if (didDelete) {
      setProjectNote('');
      setIsEditingProjectNote(false);
    } else {
      setProjectNoteError('Could not delete the project note.');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '24px auto', textAlign: 'left', padding: '0 16px 32px' }}>
      <button type="button" onClick={onBack} style={{ marginBottom: '16px', borderRadius: '999px', border: '1px solid var(--button-secondary-border)', padding: '10px 14px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', fontWeight: 600 }}>
        Back To Yarn List
      </button>
      <div style={{ ...sectionStyle, marginBottom: '20px', background: 'var(--surface-hero)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '12px' }}>{yarn.name || 'Unnamed Yarn'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>Current price</div>
            <div style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{yarn.currentPrice || 'Not available'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>Cheapest price</div>
            <div style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{yarn.lowestPrice || 'Not available'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>Last that cheap</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{formatTimestamp(yarn.lowestPriceAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>Last checked</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{formatTimestamp(yarn.lastChecked)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>Regular price</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{yarn.regularPrice || 'Not set'}</div>
          </div>
        </div>
        {(isOnSale || isAtHistoricalLow) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {isOnSale && <span style={{ borderRadius: '999px', padding: '6px 12px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', fontWeight: 600 }}>On Sale</span>}
            {isAtHistoricalLow && <span style={{ borderRadius: '999px', padding: '6px 12px', backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', fontWeight: 600 }}>Historical Low</span>}
          </div>
        )}
        <p style={{ marginBottom: '8px' }}>Source: {yarn.priceSource}</p>
        {yarn.url && (
          <a
            href={yarn.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              borderRadius: '999px',
              border: 'none',
              padding: '10px 16px',
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Buy Now
          </a>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {yarn.priceSource === 'scraped' && (
            <button type="button" onClick={() => onRefresh(yarn.id)} style={{ borderRadius: '999px', border: 'none', padding: '10px 16px', backgroundColor: 'var(--button-success-bg)', color: 'var(--button-primary-text)', fontWeight: 600 }}>
              Refresh Price
            </button>
          )}
          {yarn.status === 'active' && (
            <button type="button" onClick={() => onMarkPurchased(yarn.id)} style={{ borderRadius: '999px', border: '1px solid var(--button-secondary-border)', padding: '10px 16px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', fontWeight: 600 }}>
              Mark Purchased
            </button>
          )}
          {yarn.status === 'purchased' && (
            <button type="button" onClick={() => onRestore(yarn.id)} style={{ borderRadius: '999px', border: '1px solid var(--button-secondary-border)', padding: '10px 16px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', fontWeight: 600 }}>
              Restore To List
            </button>
          )}
          <button type="button" onClick={handleDelete} style={{ borderRadius: '999px', border: '1px solid var(--status-error-text)', padding: '10px 16px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--status-error-text)', fontWeight: 600 }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ ...sectionStyle, marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-primary)' }}>Price History</h3>
        <PriceHistoryChart priceHistory={yarn.priceHistory} lowestPriceAt={yarn.lowestPriceAt} />
      </div>

      {yarn.priceSource === 'manual' && (
        <div style={{ ...sectionStyle, marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--text-primary)' }}>Record Manual Price Change</h3>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
            <input
              type="text"
              value={manualPrice}
              onChange={(event) => setManualPrice(event.target.value)}
              placeholder="e.g. $5.49"
              style={{ flex: '1 1 220px' }}
            />
            <button type="submit" style={{ borderRadius: '999px', border: 'none', padding: '12px 18px', backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', fontWeight: 600 }}>
              Add Price Point
            </button>
          </form>
          {manualError && <p style={{ marginTop: '10px', color: 'var(--status-error-text)' }}>{manualError}</p>}
        </div>
      )}

      <div style={{ ...sectionStyle, marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--text-primary)' }}>Set Regular Price</h3>
        <form onSubmit={handleRegularPriceSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
          <input
            type="text"
            value={regularPrice}
            onChange={(event) => setRegularPrice(event.target.value)}
            placeholder="e.g. $7.99"
            style={{ flex: '1 1 220px' }}
          />
          <button type="submit" style={{ borderRadius: '999px', border: 'none', padding: '12px 18px', backgroundColor: 'var(--button-success-bg)', color: 'var(--button-primary-text)', fontWeight: 600 }}>
            Save Regular Price
          </button>
        </form>
        {regularPriceError && <p style={{ marginTop: '10px', color: 'var(--status-error-text)' }}>{regularPriceError}</p>}
      </div>

      <div style={{ ...sectionStyle, marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: yarn.projectNote && !isEditingProjectNote ? '12px' : '0' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Project Note</h3>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Keep a quick reminder of what you want to make with this yarn.</p>
          </div>
          {!isEditingProjectNote && yarn.projectNote && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button type="button" onClick={() => setIsEditingProjectNote(true)} style={{ borderRadius: '999px', border: '1px solid var(--button-secondary-border)', padding: '10px 16px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', fontWeight: 600 }}>
                Edit Note
              </button>
              <button type="button" onClick={handleDeleteProjectNote} style={{ borderRadius: '999px', border: '1px solid var(--status-error-text)', padding: '10px 16px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--status-error-text)', fontWeight: 600 }}>
                Delete Note
              </button>
            </div>
          )}
        </div>

        {isEditingProjectNote ? (
          <form onSubmit={handleProjectNoteSubmit} style={{ display: 'grid', gap: '12px' }}>
            <textarea
              value={projectNote}
              onChange={(event) => setProjectNote(event.target.value)}
              placeholder="Example: cardigan for fall, baby blanket, or a colorwork hat"
              rows={5}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button type="submit" style={{ borderRadius: '999px', border: 'none', padding: '12px 18px', backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', fontWeight: 600 }}>
                Save Note
              </button>
              <button
                type="button"
                onClick={() => {
                  setProjectNote(yarn.projectNote || '');
                  setProjectNoteError('');
                  setIsEditingProjectNote(false);
                }}
                style={{ borderRadius: '999px', border: '1px solid var(--button-secondary-border)', padding: '12px 18px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
            {projectNoteError && <p style={{ margin: 0, color: 'var(--status-error-text)' }}>{projectNoteError}</p>}
          </form>
        ) : yarn.projectNote ? (
          <p style={projectNoteDisplayStyle}>{yarn.projectNote}</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No project note saved yet.</p>
            <div>
              <button type="button" onClick={() => setIsEditingProjectNote(true)} style={{ borderRadius: '999px', border: 'none', padding: '12px 18px', backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', fontWeight: 600 }}>
                Add Project Note
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...sectionStyle }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--text-primary)' }}>Recent Price Points</h3>
        {yarn.priceHistory?.length ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {[...yarn.priceHistory].reverse().map((entry) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>{entry.displayPrice}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{formatTimestamp(entry.recordedAt)}</span>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{entry.source}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No prices recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default YarnDetail;