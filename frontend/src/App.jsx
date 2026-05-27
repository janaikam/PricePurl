import { useEffect, useEffectEvent, useState } from 'react';
import { createApiClient, fetchProductInfo } from './api';
import { parsePriceValue, updateYarnPrice } from './priceHistory';
import { guestStorageRepository, saveYarnList } from './storage';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import AddYarn from './components/AddYarn';
import AuthPanel from './components/AuthPanel';
import YarnDetail from './components/YarnDetail';
import YarnList from './components/YarnList';

const ACTIVE_STATUS = 'active';
const PURCHASED_STATUS = 'purchased';
const AUTO_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const GUEST_IMPORT_DISMISSED_KEY = 'guestImportDismissedUserId';
const MAIN_PAGE = 'main';
const AUTH_PAGE = 'auth';
const ADD_YARN_PAGE = 'add-yarn';

const pageFrameStyle = {
  padding: '0 16px 32px',
};

const headerShellStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  padding: '16px 16px 14px',
  borderBottom: '1px solid var(--header-border)',
  background: 'var(--surface-header)',
  backdropFilter: 'blur(14px)',
};

const headerInnerStyle = {
  maxWidth: '960px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
};

const wordmarkButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 16px',
  borderRadius: '999px',
  border: '1px solid var(--brand-border)',
  background: 'var(--surface-brand)',
  color: 'var(--brand-text)',
  boxShadow: 'var(--shadow-soft)',
  cursor: 'pointer',
};

const headerActionStyle = {
  borderRadius: '999px',
  border: '1px solid var(--button-secondary-border)',
  padding: '10px 16px',
  backgroundColor: 'var(--button-secondary-bg)',
  color: 'var(--button-secondary-text)',
  fontWeight: 600,
};

const feedbackBannerStyle = {
  maxWidth: '960px',
  margin: '16px auto 0',
  textAlign: 'left',
};

const infoNoticeStyle = {
  maxWidth: '960px',
  margin: '24px auto 24px',
  padding: '14px 18px',
  borderRadius: '18px',
  border: '1px solid var(--info-border)',
  background: 'var(--surface-info)',
  textAlign: 'left',
};

const authPageWrapStyle = {
  maxWidth: '960px',
  margin: '24px auto 0',
};

const formPageWrapStyle = {
  maxWidth: '960px',
  margin: '24px auto 0',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--surface-panel)',
  boxShadow: 'var(--shadow-soft)',
  textAlign: 'left',
};

const collapsibleSectionStyle = {
  maxWidth: '960px',
  margin: '0 auto 24px',
  borderRadius: '18px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--surface-card)',
  boxShadow: 'var(--shadow-soft)',
  textAlign: 'left',
  overflow: 'hidden',
};

const collapsibleToggleStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '18px 20px',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  textAlign: 'left',
  fontWeight: 700,
  cursor: 'pointer',
};

const collapsibleContentStyle = {
  padding: '0 20px 20px',
};

const prepareGuestYarnForRemote = (yarn) => {
  const { id: _id, yarnId: _yarnId, ...remoteYarn } = yarn;
  return remoteYarn;
};

function App() {
  const [yarnList, setYarnList] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedYarnId, setSelectedYarnId] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [guestYarnCount, setGuestYarnCount] = useState(0);
  const [showGuestImportPrompt, setShowGuestImportPrompt] = useState(false);
  const [isImportingGuestYarns, setIsImportingGuestYarns] = useState(false);
  const [isActiveListOpen, setIsActiveListOpen] = useState(true);
  const [isPurchasedListOpen, setIsPurchasedListOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(MAIN_PAGE);
  const accessToken = session?.access_token || '';

  const createAuthenticatedRepository = () => createApiClient({
    getAccessToken: async () => accessToken,
    onUnauthorized: async () => {
      setError('Your session expired. Continue as a guest or sign in again.');

      if (supabase) {
        await supabase.auth.signOut();
      }
    },
  });

  const getRepository = () => (accessToken ? createAuthenticatedRepository() : guestStorageRepository);

  const syncGuestStorageState = async () => {
    const guestYarns = await guestStorageRepository.fetchYarnList();
    setGuestYarnCount(guestYarns.length);

    if (!session?.user?.id) {
      setShowGuestImportPrompt(false);
      return;
    }

    const dismissedUserId = window.localStorage.getItem(GUEST_IMPORT_DISMISSED_KEY);
    setShowGuestImportPrompt(guestYarns.length > 0 && dismissedUserId !== session.user.id);
  };

  const loadYarnListFromSource = async () => {
    if (!isAuthReady) {
      return;
    }

    try {
      const nextYarnList = await getRepository().fetchYarnList();
      setYarnList(nextYarnList);
      setError('');
    } catch (err) {
      setYarnList([]);
      setError('Failed to load yarn list: ' + (err.message || err));
    }
  };

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isMounted = true;

    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError('Failed to restore your session: ' + (sessionError.message || sessionError));
      }

      setSession(data.session || null);
      setIsAuthReady(true);
    };

    void loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession || null);
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isAuthReady) {
        return;
      }

      const repository = accessToken
        ? createApiClient({
            getAccessToken: async () => accessToken,
            onUnauthorized: async () => {
              setError('Your session expired. Continue as a guest or sign in again.');

              if (supabase) {
                await supabase.auth.signOut();
              }
            },
          })
        : guestStorageRepository;

      try {
        const nextYarnList = await repository.fetchYarnList();

        if (cancelled) {
          return;
        }

        setYarnList(nextYarnList);
        setError('');
      } catch (err) {
        if (cancelled) {
          return;
        }

        setYarnList([]);
        setError('Failed to load yarn list: ' + (err.message || err));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isAuthReady, session?.user?.id]);

  useEffect(() => {
    let cancelled = false;

    const syncState = async () => {
      const guestYarns = await guestStorageRepository.fetchYarnList();

      if (cancelled) {
        return;
      }

      setGuestYarnCount(guestYarns.length);

      if (!session?.user?.id) {
        setShowGuestImportPrompt(false);
        return;
      }

      const dismissedUserId = window.localStorage.getItem(GUEST_IMPORT_DISMISSED_KEY);
      setShowGuestImportPrompt(guestYarns.length > 0 && dismissedUserId !== session.user.id);
    };

    void syncState();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, session?.user?.id]);

  const handleSignIn = async ({ email, password }) => {
    setError('');
    setNotice('');

    if (!supabase) {
      throw new Error('Supabase auth is not configured in the frontend environment.');
    }

    const result = await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      throw result.error;
    }

    setNotice('Signed in successfully.');
    setCurrentPage(MAIN_PAGE);
    return result;
  };

  const handleSignUp = async ({ email, password }) => {
    setError('');
    setNotice('');

    if (!supabase) {
      throw new Error('Supabase auth is not configured in the frontend environment.');
    }

    const result = await supabase.auth.signUp({ email, password });

    if (result.error) {
      throw result.error;
    }

    if (result.data.session) {
      setNotice('Account created and signed in.');
      setCurrentPage(MAIN_PAGE);
    } else {
      setNotice('Account created. Check your email to finish signing in.');
    }

    return result;
  };

  const handleSignOut = async () => {
    setError('');
    setNotice('');

    if (!supabase) {
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError('Failed to sign out: ' + (signOutError.message || signOutError));
      return;
    }

    setNotice('Signed out. Guest yarns in this browser are still available.');
    setCurrentPage(MAIN_PAGE);
  };

  const handleDismissGuestImport = () => {
    if (!session?.user?.id) {
      return;
    }

    window.localStorage.setItem(GUEST_IMPORT_DISMISSED_KEY, session.user.id);
    setShowGuestImportPrompt(false);
    setNotice('Guest yarns were kept in this browser only.');
  };

  const importGuestYarns = async () => {
    if (!session?.user?.id) {
      return;
    }

    setIsImportingGuestYarns(true);
    setError('');
    setNotice('');

    try {
      const guestYarns = await guestStorageRepository.fetchYarnList();
      const remainingGuestYarns = [];
      let importedCount = 0;
      let skippedCount = 0;
      const repository = createAuthenticatedRepository();

      for (const yarn of guestYarns) {
        try {
          const duplicateCheck = await repository.checkYarnDuplicate(yarn.name);

          if (duplicateCheck.alreadyOnUserList) {
            skippedCount += 1;
            continue;
          }

          await repository.createYarnEntry(prepareGuestYarnForRemote(yarn));
          importedCount += 1;
        } catch (importError) {
          console.error('Failed to import guest yarn:', importError);
          remainingGuestYarns.push(yarn);
        }
      }

      saveYarnList(remainingGuestYarns);
      window.localStorage.removeItem(GUEST_IMPORT_DISMISSED_KEY);
      await syncGuestStorageState();
      await loadYarnListFromSource();

      if (remainingGuestYarns.length > 0) {
        setError('Some guest yarns could not be imported yet. They were left in browser storage.');
      } else {
        setShowGuestImportPrompt(false);
        setNotice(`Imported ${importedCount} guest yarn${importedCount === 1 ? '' : 's'}${skippedCount ? ` and skipped ${skippedCount} duplicate${skippedCount === 1 ? '' : 's'}` : ''}.`);
      }
    } finally {
      setIsImportingGuestYarns(false);
    }
  };

  const addYarn = async (yarn) => {
    setError('');
    setNotice('');
    const newYarn = {
      ...yarn,
      name: typeof yarn.name === 'string' ? yarn.name.trim() : '',
      status: ACTIVE_STATUS,
    };

    if (newYarn.priceSource === 'scraped') {
      try {
        const scraped = await fetchProductInfo(newYarn.url);
        if (!scraped.price || !scraped.name) {
          setError('Failed to scrape product info from the link.');
          return false;
        }
        if (scraped.regularPrice) {
          newYarn.regularPrice = scraped.regularPrice;
        }

        Object.assign(newYarn, updateYarnPrice(newYarn, {
          price: scraped.price,
          recordedAt: scraped.date || new Date().toISOString(),
          source: 'scraped',
          name: scraped.name || newYarn.name,
          siteName: scraped.siteName,
        }));
      } catch (err) {
        setError('Failed to fetch product info: ' + (err.message || err));
        return false;
      }
    }

    if (!newYarn.name) {
      setError('A yarn name is required before the yarn can be added.');
      return false;
    }

    try {
      const repository = getRepository();
      const duplicateCheck = await repository.checkYarnDuplicate(newYarn.name);

      if (duplicateCheck.alreadyOnUserList) {
        const confirmed = window.confirm(`"${duplicateCheck.matchedName || newYarn.name}" is already on your yarn list. Add another instance anyway?`);

        if (!confirmed) {
          return false;
        }
      }

      const createdYarn = await repository.createYarnEntry(newYarn, {
        allowDuplicate: duplicateCheck.alreadyOnUserList,
      });

      setYarnList((prev) => [...prev, createdYarn]);
      setCurrentPage(MAIN_PAGE);
      await syncGuestStorageState();
      return true;
    } catch (err) {
      setError('Failed to add yarn: ' + (err.message || err));
      return false;
    }
  };

  const refreshPrice = async (id, { auto = false } = {}) => {
    const yarn = yarnList.find((entry) => entry.id === id);
    if (!yarn || yarn.priceSource !== 'scraped') {
      return;
    }

    try {
      const scraped = await fetchProductInfo(yarn.url);
      if (!scraped.price) {
        throw new Error('Scraper returned no price.');
      }

      const updatedYarn = updateYarnPrice({
        ...yarn,
        regularPrice: scraped.regularPrice || yarn.regularPrice,
      }, {
        price: scraped.price,
        recordedAt: scraped.date || new Date().toISOString(),
        source: 'scraped',
        name: scraped.name || yarn.name,
        siteName: scraped.siteName || yarn.siteName,
        lastAutoRefreshAt: auto ? new Date().toISOString() : yarn.lastAutoRefreshAt,
      });
      const savedYarn = await getRepository().updateYarnEntry(id, updatedYarn);

      setYarnList((prev) => prev.map((entry) => (
        entry.id === id ? savedYarn : entry
      )));
      await syncGuestStorageState();
    } catch (err) {
      if (!auto) {
        setError('Failed to refresh product info: ' + (err.message || err));
      }

      console.error('Failed to refresh product info:', err);
    }
  };

  const addManualPrice = async (id, price) => {
    if (parsePriceValue(price) === null) {
      setError('Enter a valid manual price such as 5.49 or $5.49.');
      return false;
    }

    const yarn = yarnList.find((entry) => entry.id === id);
    if (!yarn) {
      setError('Unable to find that yarn entry.');
      return false;
    }

    setError('');
    setNotice('');

    try {
      const updatedYarn = updateYarnPrice(yarn, {
        price,
        recordedAt: new Date().toISOString(),
        source: 'manual',
      });
      const savedYarn = await getRepository().updateYarnEntry(id, updatedYarn);

      setYarnList((prev) => prev.map((entry) => (
        entry.id === id ? savedYarn : entry
      )));
      await syncGuestStorageState();
      return true;
    } catch (err) {
      setError('Failed to save manual price: ' + (err.message || err));
      return false;
    }
  };

  const updateRegularPrice = async (id, regularPrice) => {
    if (parsePriceValue(regularPrice) === null) {
      setError('Enter a valid regular price such as 7.99 or $7.99.');
      return false;
    }

    const yarn = yarnList.find((entry) => entry.id === id);
    if (!yarn) {
      setError('Unable to find that yarn entry.');
      return false;
    }

    setError('');
    setNotice('');

    try {
      const savedYarn = await getRepository().updateYarnEntry(id, {
        ...yarn,
        regularPrice,
      });

      setYarnList((prev) => prev.map((entry) => (
        entry.id === id ? savedYarn : entry
      )));
      await syncGuestStorageState();
      return true;
    } catch (err) {
      setError('Failed to save regular price: ' + (err.message || err));
      return false;
    }
  };

  const saveProjectNote = async (id, projectNote) => {
    const yarn = yarnList.find((entry) => entry.id === id);
    if (!yarn) {
      setError('Unable to find that yarn entry.');
      return false;
    }

    setError('');
    setNotice('');

    try {
      const savedYarn = await getRepository().updateYarnEntry(id, {
        ...yarn,
        projectNote,
      });

      setYarnList((prev) => prev.map((entry) => (
        entry.id === id ? savedYarn : entry
      )));
      await syncGuestStorageState();
      return true;
    } catch (err) {
      setError('Failed to save project note: ' + (err.message || err));
      return false;
    }
  };

  const deleteProjectNote = async (id) => saveProjectNote(id, '');

  const updateYarnStatus = async (id, status) => {
    try {
      const savedYarn = await getRepository().updateYarnEntryStatus(id, status);

      setYarnList((prev) => prev.map((yarn) => (
        yarn.id === id ? savedYarn : yarn
      )));
      await syncGuestStorageState();
    } catch (err) {
      setError('Failed to update yarn status: ' + (err.message || err));
    }
  };

  const markAsPurchased = (id) => {
    void updateYarnStatus(id, PURCHASED_STATUS);
  };

  const restoreYarn = (id) => {
    void updateYarnStatus(id, ACTIVE_STATUS);
  };

  const deleteYarn = async (id) => {
    try {
      await getRepository().deleteYarnEntry(id);

      if (selectedYarnId === id) {
        setSelectedYarnId(null);
      }

      setYarnList((prev) => prev.filter((yarn) => yarn.id !== id));
      await syncGuestStorageState();
    } catch (err) {
      setError('Failed to delete yarn: ' + (err.message || err));
    }
  };

  const runAutoRefresh = useEffectEvent(() => {
    const scrapedYarns = yarnList.filter((yarn) => yarn.priceSource === 'scraped' && yarn.url);
    scrapedYarns.forEach((yarn) => {
      void refreshPrice(yarn.id, { auto: true });
    });
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      runAutoRefresh();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeYarnList = yarnList.filter((yarn) => yarn.status !== PURCHASED_STATUS);
  const purchasedYarnList = yarnList.filter((yarn) => yarn.status === PURCHASED_STATUS);
  const selectedYarn = yarnList.find((yarn) => yarn.id === selectedYarnId) || null;
  const activeListLabel = `Your Yarn List (${activeYarnList.length})`;
  const purchasedListLabel = `Purchased Yarn (${purchasedYarnList.length})`;
  const showGuestSaveNotice = !session?.user && currentPage === MAIN_PAGE && !selectedYarn;
  const accountActionLabel = session?.user ? 'Account' : 'Sign In';
  const isMainPage = currentPage === MAIN_PAGE;
  const isAuthPage = currentPage === AUTH_PAGE;
  const isAddYarnPage = currentPage === ADD_YARN_PAGE;

  const createHeaderActionStyle = (isActive) => ({
    ...headerActionStyle,
    borderColor: isActive ? 'var(--button-primary-bg)' : headerActionStyle.border.split(' ')[2],
    backgroundColor: isActive ? 'var(--accent-bg)' : 'var(--button-secondary-bg)',
    color: isActive ? 'var(--text-primary)' : 'var(--button-secondary-text)',
  });

  return (
    <div>
      <header style={headerShellStyle}>
        <div style={headerInnerStyle}>
          <button
            type="button"
            onClick={() => {
              setCurrentPage(MAIN_PAGE);
              setSelectedYarnId(null);
            }}
            style={wordmarkButtonStyle}
          >
            <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: 'var(--button-primary-bg)', boxShadow: '0 0 0 5px var(--accent-bg)' }} />
            <span style={{ display: 'grid', textAlign: 'left', lineHeight: 1.05 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Price Purl</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Yarn Tracker</span>
            </span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {session?.user && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {session.user.email || 'Signed in'}
              </span>
            )}
            <button type="button" onClick={() => {
              setSelectedYarnId(null);
              setCurrentPage(ADD_YARN_PAGE);
            }} style={createHeaderActionStyle(isAddYarnPage)}>
              Add Yarn
            </button>
            <button type="button" onClick={() => {
              setSelectedYarnId(null);
              setCurrentPage(AUTH_PAGE);
            }} style={createHeaderActionStyle(isAuthPage)}>
              {accountActionLabel}
            </button>
          </div>
        </div>
      </header>

      <div style={pageFrameStyle}>
        {error && <div style={{ ...feedbackBannerStyle, color: 'var(--status-error-text)' }}>{error}</div>}
        {notice && <div style={{ ...feedbackBannerStyle, color: 'var(--status-success-text)' }}>{notice}</div>}

        {session?.user && showGuestImportPrompt && isMainPage && (
          <div style={{ maxWidth: '960px', margin: '24px auto 24px', padding: '16px 18px', borderRadius: '18px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-card)', boxShadow: 'var(--shadow-soft)', textAlign: 'left' }}>
          <p style={{ marginBottom: '12px' }}>
            You still have {guestYarnCount} guest yarn{guestYarnCount === 1 ? '' : 's'} stored only in this browser. Import them into your signed-in account?
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={importGuestYarns} disabled={isImportingGuestYarns} style={{ borderRadius: '999px', border: 'none', padding: '10px 16px', backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', fontWeight: 600 }}>
              {isImportingGuestYarns ? 'Importing...' : 'Import Into Account'}
            </button>
            <button type="button" onClick={handleDismissGuestImport} style={{ borderRadius: '999px', border: '1px solid var(--button-secondary-border)', padding: '10px 16px', backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', fontWeight: 600 }}>
              Keep Local Only
            </button>
          </div>
        </div>
      )}

        {isAuthPage ? (
          <div style={authPageWrapStyle}>
            <AuthPanel
              session={session}
              isAuthReady={isAuthReady}
              isSupabaseConfigured={isSupabaseConfigured}
              guestYarnCount={guestYarnCount}
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              onSignOut={handleSignOut}
              onImportGuestYarns={importGuestYarns}
              isImportingGuestYarns={isImportingGuestYarns}
              onBack={() => setCurrentPage(MAIN_PAGE)}
            />
          </div>
        ) : isAddYarnPage ? (
          <section style={formPageWrapStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <p style={{ marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.78rem' }}>Add To Tracker</p>
                <h2 style={{ marginTop: 0, marginBottom: 0 }}>Add a new yarn</h2>
              </div>
              <button type="button" onClick={() => setCurrentPage(MAIN_PAGE)} style={headerActionStyle}>
                Back To Yarn List
              </button>
            </div>
            <p style={{ marginBottom: '18px', color: 'var(--text-secondary)' }}>
              Paste a product link to pull details automatically, or enter the yarn manually if you already know the price.
            </p>
            <AddYarn onAddYarn={addYarn} />
          </section>
        ) : selectedYarn ? (
          <YarnDetail
            key={selectedYarn.id}
            yarn={selectedYarn}
            onBack={() => setSelectedYarnId(null)}
            onRefresh={refreshPrice}
            onAddManualPrice={addManualPrice}
            onUpdateRegularPrice={updateRegularPrice}
            onSaveProjectNote={saveProjectNote}
            onDeleteProjectNote={deleteProjectNote}
            onMarkPurchased={markAsPurchased}
            onRestore={restoreYarn}
            onDelete={deleteYarn}
          />
        ) : (
          <>
            {showGuestSaveNotice && (
              <section style={infoNoticeStyle}>
                <p style={{ marginBottom: !isSupabaseConfigured ? '8px' : 0, color: 'var(--text-primary)', fontWeight: 600 }}>
                  Sign in to keep your yarn list saved across devices.
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {isSupabaseConfigured
                    ? 'If you stay in guest mode, your yarns remain saved only in this browser.'
                    : 'Supabase auth is not configured in this environment yet, so your yarns stay in this browser only.'}
                </p>
              </section>
            )}

          <section style={collapsibleSectionStyle}>
            <button
              type="button"
              onClick={() => setIsActiveListOpen((currentValue) => !currentValue)}
              style={collapsibleToggleStyle}
              aria-expanded={isActiveListOpen}
            >
              <span>{activeListLabel}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{isActiveListOpen ? 'Hide' : 'Show'}</span>
            </button>
            {isActiveListOpen && (
              <div style={collapsibleContentStyle}>
                <YarnList
                  title="Your Yarn List"
                  emptyMessage="No yarns in your active list yet."
                  yarnList={activeYarnList}
                  onSelectYarn={setSelectedYarnId}
                  hideTitle
                />
              </div>
            )}
          </section>

          <section style={collapsibleSectionStyle}>
            <button
              type="button"
              onClick={() => setIsPurchasedListOpen((currentValue) => !currentValue)}
              style={collapsibleToggleStyle}
              aria-expanded={isPurchasedListOpen}
            >
              <span>{purchasedListLabel}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{isPurchasedListOpen ? 'Hide' : 'Show'}</span>
            </button>
            {isPurchasedListOpen && (
              <div style={collapsibleContentStyle}>
                <YarnList
                  title="Purchased Yarn"
                  emptyMessage="No purchased yarn is hidden right now."
                  yarnList={purchasedYarnList}
                  onSelectYarn={setSelectedYarnId}
                  hideTitle
                />
              </div>
            )}
          </section>

          </>
        )}
      </div>
    </div>
  );
}

export default App;
