import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005').replace(/\/+$/, '');
const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const interests = ['Food', 'History', 'Nature', 'Art', 'Shopping', 'Adventure', 'Wellness', 'Nightlife'];
const styles = ['Balanced', 'Slow & relaxed', 'Adventure', 'Culture-first', 'Family-friendly', 'Budget-conscious'];
const destinations = [
  { name: 'Lisbon', place: 'Portugal', note: 'Tile, hills & long lunches', mark: '01', art: 'lisbon' },
  { name: 'Kyoto', place: 'Japan', note: 'Quiet lanes, vivid seasons', mark: '02', art: 'kyoto' },
  { name: 'Dolomites', place: 'Italy', note: 'Alpine air & open trails', mark: '03', art: 'dolomites' },
];

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(`Cannot reach the planner API at ${API} from ${window.location.origin}. Check VITE_API_URL, confirm FastAPI is running, and verify that CORS allows this page.`);
  }
  let payload = null;
  if (response.status !== 204) {
    try { payload = await response.json(); }
    catch { throw new Error(`The planner API returned HTTP ${response.status} with an unreadable response.`); }
  }
  if (!response.ok) {
    const detail = Array.isArray(payload?.detail)
      ? payload.detail.map(item => item.msg || 'Invalid request').join('; ')
      : payload?.detail || 'The request could not be completed.';
    throw new Error(`Planner API returned HTTP ${response.status}: ${detail}`);
  }
  return payload;
}

function Icon({ name, size = 18, className = '' }) {
  const paths = {
    arrow: <><path d="M4 12h15"/><path d="m13 5 7 7-7 7"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.7M18 14a5 5 0 0 1 3 4.6v1"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z"/></>,
    fork: <><path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6M18 3v3M6 3v3"/><path d="M4 3v3M8 3v3M16 3v3M20 3v3"/></>,
    bed: <><path d="M3 19V6M3 16h18v3M3 12h18v4M7 12V9h5a3 3 0 0 1 3 3"/><path d="M15 12V9h2a4 4 0 0 1 4 3"/></>,
    forkKnife: <><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c-2 2-3 5-3 8h6c0-3-1-6-3-8Z"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.compass}</svg>;
}

function CoastScene() {
  return <svg className="coast-scene" viewBox="0 0 760 620" role="img" aria-label="Illustrated coastal village above a deep green sea" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e8c7a4"/><stop offset=".53" stopColor="#f0dfc3"/><stop offset="1" stopColor="#c6d0bd"/></linearGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8ea99a"/><stop offset=".52" stopColor="#547a70"/><stop offset="1" stopColor="#264d48"/></linearGradient>
      <linearGradient id="cliff" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9a77d"/><stop offset="1" stopColor="#9e6a51"/></linearGradient>
      <pattern id="waves" width="74" height="26" patternUnits="userSpaceOnUse"><path d="M0 14c10-6 21-6 31 0s21 6 31 0 11-6 12-6" fill="none" stroke="#f1dfc4" strokeOpacity=".24" strokeWidth="1"/></pattern>
    </defs>
    <rect width="760" height="620" fill="url(#sky)"/>
    <circle cx="570" cy="122" r="57" fill="#d98d65" opacity=".9"/>
    <path d="M0 320 111 216l87 74 94-122 131 148 82-85 117 117 70-51 68 55v268H0Z" fill="#84958a" opacity=".56"/>
    <path d="M0 359 108 284l88 66 93-107 132 118 80-77 105 87 74-39 80 51v237H0Z" fill="#536e62" opacity=".73"/>
    <path d="M0 384c116-37 222-31 330 13 117 48 279 54 430-11v234H0Z" fill="url(#sea)"/>
    <path d="M0 384c116-37 222-31 330 13 117 48 279 54 430-11v234H0Z" fill="url(#waves)"/>
    <path d="M0 344c123 27 208 23 300-8 50-17 94-18 133 2-25 39-53 72-85 104-52 69-76 117-88 178H0Z" fill="#384c3e"/>
    <path d="M0 345c110 30 213 25 291-4-28 46-51 76-78 105-55 58-86 114-96 174H0Z" fill="url(#cliff)"/>
    <path d="M74 353c72 13 141 7 205-17l-10 17c-62 22-120 29-181 21Z" fill="#efe0c5"/>
    <g stroke="#f3dfbf" strokeWidth="2">
      <path d="M148 309v-49h40v64M197 291v-63h49v55M246 285v-44h36v35M285 275v-80h48v84M332 274v-58h37v73M372 281v-43h42v54" fill="#c77d5c"/>
      <path d="M154 260h31m17-33h36m-31 20v11m8-11v11m8-11v11m8-11v11m63-53h36m-28 23v12m11-12v12m-51 58v-18m12 18v-18m24 18v-19m-85 28v-17m11 17v-17m110 28v-18m12 18v-18" fill="none"/>
      <path d="m142 260 26-20 27 20m-4-35 28-24 29 24m-6 34 20-19 23 19m-9-45 30-25 31 25m-7 36 22-17 24 17" fill="#a65f4b"/>
    </g>
    <path d="M437 338c66-36 127-36 185-19 50 14 85 15 138-4v68c-85 42-176 53-277 18-38-13-67-27-90-42Z" fill="#233d35"/>
    <g fill="#233d35"><path d="M543 319c-6-44 5-86 33-126 19 34 27 76 16 129Z"/><path d="M574 317c5-60 26-111 68-151 5 58-12 108-43 160Z"/><path d="M502 327c-2-38-17-69-46-97 0 45 9 78 32 105Z"/></g>
    <path d="M36 548c87-6 146 7 206 35M420 520c93-2 166 14 251 47M452 571c64 1 120 12 176 33" fill="none" stroke="#e4d1b1" strokeOpacity=".52" strokeWidth="2"/>
    <path d="M485 407h48" stroke="#f0dfc3" strokeWidth="3" strokeLinecap="round"/>
    <g transform="translate(583 365)"><path d="M0 29h72l-10 10H12Z" fill="#f1e5cf"/><path d="M36 0v29H7Z" fill="#f1e5cf"/><path d="M38 4v25h26Z" fill="#d78a65"/><path d="M36 0v39" stroke="#334d42" strokeWidth="2"/></g>
    <rect width="760" height="620" fill="none" stroke="#fff8e9" strokeOpacity=".56" strokeWidth="18"/>
  </svg>;
}

function SiteHeader({ user, onSignOut }) {
  return <header className="site-header">
    <a className="wordmark" href="#top" aria-label="Wayfarer home"><span className="wordmark-symbol">W</span><span>wayfarer<small>TRAVEL, THOUGHTFULLY</small></span></a>
    <nav className="main-nav" aria-label="Main navigation"><a href="#inspiration">Find inspiration</a><a href="#planner">Plan a trip</a><a href="#saved">My journeys</a></nav>
    {user ? <button className="header-account" onClick={onSignOut}><span className="account-dot"/>{user.email}<span className="signout-label">Sign out</span></button> : <a className="header-signin" href="#saved">Sign in <Icon name="arrow" size={15}/></a>}
  </header>;
}

function SectionKicker({ children, number }) {
  return <div className="section-kicker"><span>{number}</span><span>{children}</span></div>;
}

function TripForm({ trip, setTrip, onSubmit, busy }) {
  const selectedDuration = trip.start_date && trip.end_date
    ? Math.max(1, Math.round((new Date(`${trip.end_date}T00:00:00`) - new Date(`${trip.start_date}T00:00:00`)) / 86_400_000) + 1)
    : 0;
  const patch = (key, value) => setTrip(current => ({ ...current, [key]: value }));
  const toggleInterest = interest => patch('interests', trip.interests.includes(interest)
    ? trip.interests.filter(value => value !== interest)
    : [...trip.interests, interest]);

  return <section className="planning-section" id="planner">
    <div className="section-intro">
      <SectionKicker number="01">THE PLANNING STUDIO</SectionKicker>
      <h2>Start with a place.<br/><em>Make it your own.</em></h2>
      <p>A few thoughtful details are all we need to find the shape of your trip.</p>
      <div className="planner-aside"><span className="aside-rule"/><span>Built around your pace,<br/>your people, your point of view.</span></div>
    </div>
    <form className="planner-form" onSubmit={onSubmit}>
      <div className="form-step"><span className="form-step-number">01</span><div className="form-step-content">
        <label className="field-label" htmlFor="destination">Where are you headed?</label>
        <div className="destination-input"><Icon name="pin"/><input id="destination" required minLength="2" maxLength="100" value={trip.destination} onChange={event => patch('destination', event.target.value)} placeholder="A city, a coastline, a feeling" autoComplete="off"/><span className="input-hint">DESTINATION</span></div>
        <div className="quick-destinations"><span className="micro-label">A PLACE TO BEGIN</span>{destinations.map(place => <button type="button" key={place.name} onClick={() => patch('destination', place.name)} className={trip.destination.toLowerCase() === place.name.toLowerCase() ? 'quick-place is-active' : 'quick-place'}>{place.name}<span>{place.place}</span></button>)}</div>
      </div></div>
      <div className="form-step"><span className="form-step-number">02</span><div className="form-step-content">
        <div className="field-row"><label className="field-label" htmlFor="start-date">When do you go?<input id="start-date" required type="date" min={today} value={trip.start_date} onChange={event => patch('start_date', event.target.value)}/></label><label className="field-label" htmlFor="end-date">When do you return?<input id="end-date" required type="date" min={trip.start_date} value={trip.end_date} onChange={event => patch('end_date', event.target.value)}/></label></div>
        <div className="duration-line"><Icon name="calendar" size={15}/><span>{selectedDuration ? `${selectedDuration} ${selectedDuration === 1 ? 'day' : 'days'} away` : 'Choose your dates'}</span><span className="duration-dot"/>Flexible dates are welcome</div>
      </div></div>
      <div className="form-step"><span className="form-step-number">03</span><div className="form-step-content">
        <div className="field-row field-row-budget"><label className="field-label" htmlFor="budget">Your total budget<input id="budget" required type="number" min="1" max="10000000" value={trip.budget} onChange={event => patch('budget', event.target.value)} placeholder="Set a comfortable limit"/></label><label className="field-label field-label-currency" htmlFor="currency">Currency<select id="currency" value={trip.currency} onChange={event => patch('currency', event.target.value)}>{['USD','EUR','GBP','INR','CAD','AUD','JPY'].map(code => <option key={code}>{code}</option>)}</select></label><label className="field-label field-label-guests" htmlFor="travellers">Travellers<select id="travellers" value={trip.travellers} onChange={event => patch('travellers', Number(event.target.value))}>{Array.from({length: 20}, (_, index) => index + 1).map(count => <option key={count} value={count}>{count} {count === 1 ? 'person' : 'people'}</option>)}</select></label></div>
      </div></div>
      <div className="form-step"><span className="form-step-number">04</span><div className="form-step-content">
        <span className="field-label">How do you like to travel?</span><div className="style-options" role="group" aria-label="Travel style">{styles.map((style, index) => <button key={style} type="button" aria-pressed={trip.travel_style === style} onClick={() => patch('travel_style', style)} className={trip.travel_style === style ? 'style-option is-selected' : 'style-option'}><span className="style-index">{String(index + 1).padStart(2, '0')}</span>{style}{trip.travel_style === style && <Icon name="check" size={15}/>}</button>)}</div>
      </div></div>
      <div className="form-step form-step-last"><span className="form-step-number">05</span><div className="form-step-content">
        <span className="field-label">What do you want more of?</span><div className="interest-options" aria-label="Trip interests">{interests.map(interest => <button key={interest} type="button" aria-pressed={trip.interests.includes(interest.toLowerCase())} onClick={() => toggleInterest(interest.toLowerCase())} className={trip.interests.includes(interest.toLowerCase()) ? 'interest-option is-selected' : 'interest-option'}>{interest}</button>)}</div>
        {!trip.interests.length && <span className="field-help">Choose at least one to shape your itinerary.</span>}
      </div></div>
      <div className="form-submit-row"><div className="trip-glance"><span className="micro-label">YOUR TRIP, AT A GLANCE</span><span>{trip.destination || 'Your destination'} <i>·</i> {selectedDuration || '—'} {selectedDuration === 1 ? 'day' : 'days'} <i>·</i> {trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'}</span></div><button className="button-primary generate-button" disabled={busy || !trip.interests.length}>{busy ? <><span className="button-spinner"/>Finding your way…</> : <>Build my itinerary <Icon name="arrow" size={17}/></>}</button></div>
    </form>
  </section>;
}

function ItineraryView({ itinerary, trip, busy, selectedDay, setSelectedDay, editing, setEditing, onRegenerate, onCommitDay, onNewTrip, onSave, savedId, user }) {
  const activeDay = itinerary.days[selectedDay] || itinerary.days[0];
  if (!activeDay) return null;
  const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const isEditing = editing?.day === selectedDay;

  return <section className="itinerary-section" id="itinerary" aria-live="polite">
    <div className="itinerary-heading"><div><SectionKicker number="02">YOUR JOURNEY, TAKING SHAPE</SectionKicker><div className="itinerary-title-row"><div><span className={itinerary.source === 'gemini' ? 'source-label source-ai' : 'source-label'}><Icon name="sparkle" size={13}/>{itinerary.source === 'gemini' ? 'PERSONALISED PLAN' : 'THOUGHTFUL STARTING POINT'}</span><h2>{itinerary.destination}</h2></div><div className="itinerary-heading-actions"><button className="text-action" onClick={onNewTrip}>New trip</button><button className="button-outline" onClick={onSave} disabled={!user}>{savedId ? 'Update saved trip' : 'Save this journey'}</button></div></div></div>
      <div className="trip-facts"><span><Icon name="calendar" size={16}/>{formatDate(itinerary.days[0].date)} – {formatDate(itinerary.days.at(-1).date)}</span><span><Icon name="clock" size={16}/>{itinerary.days.length} days</span><span><Icon name="people" size={17}/>{trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'}</span><span><Icon name="compass" size={17}/>{trip.travel_style}</span></div>
    </div>
    {itinerary.notice && <p className={itinerary.source === 'fallback' ? 'notice notice-fallback' : 'notice'}><Icon name="sparkle" size={16}/>{itinerary.notice}</p>}
    <div className="itinerary-workspace">
      <nav className="day-rail" aria-label="Itinerary days"><span className="micro-label">THE DAYS</span>{itinerary.days.map((day, index) => <button key={day.date} className={selectedDay === index ? 'day-rail-item is-current' : 'day-rail-item'} onClick={() => { setSelectedDay(index); setEditing(null); }} aria-current={selectedDay === index ? 'step' : undefined}><span className="rail-day-number">{String(index + 1).padStart(2, '0')}</span><span className="rail-day-copy"><small>{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small>{day.title.replace(/^Day \d+:\s*/, '')}</span><span className="rail-marker"/></button>)}<div className="rail-note"><span>TAKE YOUR TIME</span><p>Leave room for the moments you didn’t plan.</p></div></nav>
      <article className="day-sheet"><div className="day-sheet-head"><div><span className="sheet-date">{formatDate(activeDay.date)}</span><h3>{activeDay.title.replace(/^Day \d+:\s*/, '')}</h3></div><div className="day-tools"><button className="text-action" onClick={() => setEditing(isEditing ? null : { day: selectedDay, draft: { ...activeDay } })}>{isEditing ? 'Close editor' : 'Edit day'}</button><button className="icon-action" aria-label="Regenerate this day" title="Regenerate this day" disabled={busy} onClick={() => onRegenerate(selectedDay)}><Icon name="sparkle" size={16}/><span>{busy ? 'Refreshing…' : 'Refresh day'}</span></button></div></div>
        {isEditing ? <div className="day-editor"><div className="editor-header"><span>MAKE THIS DAY YOURS</span><span>Changes stay with this itinerary</span></div><label>Day title<input value={editing.draft.title} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, title: event.target.value } }))}/></label>{['food','transport','accommodation'].map(key => <label key={key}>{key === 'food' ? 'Food & dining' : key === 'transport' ? 'Getting around' : 'Place to stay'}<textarea rows="2" value={editing.draft[key]} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, [key]: event.target.value } }))}/></label>)}{editing.draft.activities.map((activity, activityIndex) => <fieldset className="editor-activity" key={activityIndex}><legend>STOP {String(activityIndex + 1).padStart(2, '0')}</legend><div className="field-row"><label>Time<input value={activity.time} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, activities: current.draft.activities.map((item, index) => index === activityIndex ? { ...item, time: event.target.value } : item) } }))}/></label><label>Activity<input value={activity.name} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, activities: current.draft.activities.map((item, index) => index === activityIndex ? { ...item, name: event.target.value } : item) } }))}/></label></div><label>Notes<textarea rows="2" value={activity.description} onChange={event => setEditing(current => ({ ...current, draft: { ...current.draft, activities: current.draft.activities.map((item, index) => index === activityIndex ? { ...item, description: event.target.value } : item) } }))}/></label></fieldset>)}<div className="editor-actions"><button className="text-action" onClick={() => setEditing(null)}>Discard changes</button><button className="button-primary" onClick={onCommitDay}>Keep these changes <Icon name="check" size={16}/></button></div></div> : <>
          <div className="day-timeline">{activeDay.activities.map((activity, index) => <div className="timeline-stop" key={`${activity.time}-${activity.name}`}><div className="timeline-time">{activity.time}</div><div className="timeline-track"><span className="timeline-node"/><span className="timeline-line"/></div><div className="timeline-copy"><span className="stop-label">{index === 0 ? 'A GOOD PLACE TO BEGIN' : index === activeDay.activities.length - 1 ? 'WHEN THE DAY SLOWS' : 'IN BETWEEN'}</span><h4>{activity.name}</h4><p>{activity.description}</p></div></div>)}</div>
          {activeDay.notes && <p className="local-note"><Icon name="sparkle" size={15}/>{activeDay.notes}</p>}
          <div className="day-guides"><div className="guide-item guide-food"><div className="guide-icon"><Icon name="forkKnife" size={18}/></div><div><span>AT THE TABLE</span><p>{activeDay.food}</p></div></div><div className="guide-item guide-move"><div className="guide-icon"><Icon name="fork" size={18}/></div><div><span>GETTING AROUND</span><p>{activeDay.transport}</p></div></div><div className="guide-item guide-stay"><div className="guide-icon"><Icon name="bed" size={19}/></div><div><span>REST YOUR HEAD</span><p>{activeDay.accommodation}</p></div></div></div>
        </>}
        <div className="day-sheet-foot"><span>DAY ESTIMATE <small>Planning estimate, not a live price</small></span><strong>{itinerary.currency} {Number(activeDay.estimated_cost).toLocaleString(undefined,{maximumFractionDigits:0})}</strong></div>
        <div className="day-pagination"><button className="text-action" disabled={selectedDay === 0} onClick={() => { setSelectedDay(value => value - 1); setEditing(null); }}>← Previous day</button><span>{String(selectedDay + 1).padStart(2, '0')} <i>/</i> {String(itinerary.days.length).padStart(2, '0')}</span><button className="text-action" disabled={selectedDay === itinerary.days.length - 1} onClick={() => { setSelectedDay(value => value + 1); setEditing(null); }}>Next day →</button></div>
      </article>
    </div>
    <div className="cost-summary"><div className="cost-total"><span className="micro-label">THE WHOLE JOURNEY</span><strong>{itinerary.currency} {Number(itinerary.estimated_total).toLocaleString(undefined,{maximumFractionDigits:0})}</strong><span>Estimated total · {itinerary.days.length} days · {trip.travellers} travellers</span></div><div className="cost-categories">{Object.entries(itinerary.cost_breakdown || {}).map(([category, amount]) => <div className="cost-category" key={category}><span>{category}</span><strong>{itinerary.currency} {Number(amount).toLocaleString(undefined,{maximumFractionDigits:0})}</strong></div>)}</div></div>
  </section>;
}

function Inspiration({ onChoose }) {
  return <section className="inspiration-section" id="inspiration">
    <div className="inspiration-heading"><div><SectionKicker number="02">A FEW PLACES TO BEGIN</SectionKicker><h2>Somewhere on<br/><em>your wavelength.</em></h2></div><p>Not a top-ten list. Just a few places with a particular kind of pull.</p></div>
    <div className="destination-stories">{destinations.map((place, index) => <button key={place.name} onClick={() => onChoose(place.name)} className={`destination-story story-${index + 1} art-${place.art}`}><span className="story-mark">{place.mark} / {place.place}</span><span className="story-title">{place.name}<small>{place.note}</small></span><span className="story-arrow"><Icon name="arrow" size={19}/></span><span className="scene-shape scene-a"/><span className="scene-shape scene-b"/><span className="scene-shape scene-c"/></button>)}</div>
  </section>;
}

function HowItWorks() {
  return <section className="how-section" id="journey"><div className="how-head"><SectionKicker number="03">A LITTLE STRUCTURE, A LOT OF FREEDOM</SectionKicker><p>Good trips don’t need a minute-by-minute plan.<br/><em>Just a thoughtful place to start.</em></p></div><div className="how-steps"><article><span>01</span><h3>Tell us what moves you</h3><p>Dates, budget, travel companions, and the things you always make time for.</p></article><article><span>02</span><h3>Find your day’s rhythm</h3><p>Get a flexible itinerary shaped around your interests, with room to wander.</p></article><article><span>03</span><h3>Make it yours</h3><p>Adjust a day, save the plan, and keep the details close as your trip takes shape.</p></article></div></section>;
}

function AccountSection({ user, saved, email, setEmail, password, setPassword, authMode, setAuthMode, authBusy, authNotice, error, onAuth, onSignOut, onLoad, onDelete, onPlan }) {
  return <section className="saved-section" id="saved"><div className="saved-head"><div><SectionKicker number="04">YOUR TRAVEL JOURNAL</SectionKicker><h2>Journeys worth<br/><em>coming back to.</em></h2></div><p>Keep your plans in one place. Pick up where you left off whenever you’re ready.</p></div>
    {!supabase ? <div className="account-unavailable"><span className="micro-label">PRIVATE BY DESIGN</span><p>Connect your Supabase project to sign in and keep your journeys here.</p></div> : user ? <>
      <div className="signed-in-bar"><div><span className="account-dot"/><span>YOUR JOURNAL</span><strong>{user.email}</strong></div><button className="text-action" onClick={onSignOut}>Sign out</button></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {saved.length ? <div className="saved-list">{saved.map((row, index) => <article className="saved-trip-row" key={row.id}><span className="saved-number">{String(index + 1).padStart(2, '0')}</span><div className="saved-trip-title"><span>{row.trip?.start_date || 'YOUR SAVED JOURNEY'}</span><h3>{row.title}</h3><p>{row.trip?.travellers || 1} travellers <i>·</i> {row.trip?.currency || '—'} {Number(row.trip?.budget || 0).toLocaleString()}</p></div><button className="saved-open" onClick={() => onLoad(row)}>Open journey <Icon name="arrow" size={16}/></button><button className="saved-delete" aria-label={`Delete ${row.title}`} onClick={() => onDelete(row.id)}><Icon name="close" size={17}/></button></article>)}</div> : <div className="saved-empty"><div className="empty-ornament"><span/><span/><span/></div><div><span className="micro-label">A FRESH PAGE</span><h3>No journeys saved yet.</h3><p>Your next well-planned escape can live here.</p><button className="text-action" onClick={onPlan}>Begin a new plan <Icon name="arrow" size={16}/></button></div></div>}
    </> : <div className="auth-layout"><div className="auth-story"><span className="micro-label">A PLACE FOR YOUR PLANS</span><p>Sign in to keep your itineraries close, and make a small travel journal of your own.</p><span className="auth-script">see you out there.</span></div><form className="auth-form" onSubmit={onAuth}><div className="auth-tabs" role="tablist" aria-label="Account access"><button type="button" role="tab" aria-selected={authMode === 'signin'} className={authMode === 'signin' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => setAuthMode('signin')}>Sign in</button><button type="button" role="tab" aria-selected={authMode === 'signup'} className={authMode === 'signup' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => setAuthMode('signup')}>Create account</button></div><p>{authMode === 'signup' ? 'A little space to keep the trips you’re dreaming up.' : 'Welcome back. Your next journey is waiting.'}</p><label htmlFor="account-email">Email address<input id="account-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label><label htmlFor="account-password">Password<input id="account-password" type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength="6" required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters"/></label>{authNotice && <p className="auth-notice" role="status">{authNotice}</p>}{error && <p className="inline-error" role="alert">{error}</p>}<button className="button-primary auth-submit" disabled={authBusy}>{authBusy ? 'One moment…' : authMode === 'signup' ? 'Create your journal' : 'Sign in to your journal'} <Icon name="arrow" size={16}/></button><small>Your saved trips are private to your account.</small></form></div>}
  </section>;
}

export default function App() {
  const [trip, setTrip] = useState({ destination: '', start_date: today, end_date: today, budget: '', currency: 'USD', interests: [], travel_style: 'Balanced', travellers: 1 });
  const [itinerary, setItinerary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [editing, setEditing] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');
  const itineraryRef = useRef(null);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  const tripDuration = useMemo(() => {
    if (!trip.start_date || !trip.end_date) return 0;
    return Math.max(1, Math.round((new Date(`${trip.end_date}T00:00:00`) - new Date(`${trip.start_date}T00:00:00`)) / 86_400_000) + 1);
  }, [trip.start_date, trip.end_date]);

  async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Your session has ended. Sign in again to manage saved journeys.');
    return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
  }

  async function loadSaved() {
    if (!user) return;
    setSavedLoading(true);
    try { setSaved(await apiRequest('/api/trips', { headers: await authHeaders() })); }
    catch (loadError) { setError(loadError.message); }
    finally { setSavedLoading(false); }
  }

  useEffect(() => { if (user) loadSaved(); else setSaved([]); }, [user]);

  function updateTrip(key, value) { setTrip(current => ({ ...current, [key]: value })); }

  async function generate(e) {
    e.preventDefault();
    if (e.currentTarget?.tagName === 'FORM') { setSavedId(null); setSaveNotice(''); }
    setError(''); setBusy(true); setEditing(null);
    try {
      const response = await apiRequest('/api/itineraries/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...trip, budget: Number(trip.budget) }) });
      setItinerary(response); setSelectedDay(0);
      requestAnimationFrame(() => itineraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function regenerateDay(index) {
    setBusy(true); setError(''); setSaveNotice('');
    try {
      const day = await apiRequest('/api/itineraries/regenerate-day', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trip: { ...trip, budget: Number(trip.budget) }, day_index: index }) });
      setItinerary(current => ({ ...current, days: current.days.map((item, itemIndex) => itemIndex === index ? day : item) }));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  function commitDayEdit() {
    if (!editing || editing.day !== selectedDay) return;
    setItinerary(current => ({ ...current, days: current.days.map((day, index) => index === selectedDay ? editing.draft : day) }));
    setEditing(null); setSaveNotice('Day updated in your itinerary.');
  }

  async function persistTrip() {
    if (!user || !itinerary) { document.querySelector('#saved')?.scrollIntoView({ behavior: 'smooth' }); return; }
    setError(''); setSaveNotice('');
    try {
      const title = `${trip.destination} · ${trip.start_date}`;
      const rows = await apiRequest(savedId ? `/api/trips/${savedId}` : '/api/trips', { method: savedId ? 'PATCH' : 'POST', headers: await authHeaders(), body: JSON.stringify({ user_id: user.id, title, trip: { ...trip, budget: Number(trip.budget) }, itinerary }) });
      if (!savedId && rows?.[0]?.id) setSavedId(rows[0].id);
      setSaveNotice(savedId ? 'Your saved journey has been updated.' : 'Journey saved to your travel journal.');
      await loadSaved();
    } catch (requestError) { setError(requestError.message); }
  }

  async function deleteTrip(id) {
    setError('');
    try {
      await apiRequest(`/api/trips/${id}`, { method: 'DELETE', headers: await authHeaders() });
      if (savedId === id) setSavedId(null);
      setSaveNotice('Journey removed from your journal.');
      await loadSaved();
    } catch (requestError) { setError(requestError.message); }
  }

  async function submitAuth(e) {
    e.preventDefault(); setError(''); setAuthNotice(''); setAuthBusy(true);
    try {
      const result = authMode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (authMode === 'signup' && !result.data.session) setAuthNotice('Check your inbox for a verification link, then return here to sign in.');
      else if (authMode === 'signup') setAuthNotice('Your account is ready. Welcome to your travel journal.');
    } catch (authError) { setError(authError.message || 'We couldn’t complete sign in. Check your details and try again.'); }
    finally { setAuthBusy(false); }
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message); else { setSaved([]); setSavedId(null); setSaveNotice(''); }
  }

  function openTrip(row) {
    setTrip(row.trip); setItinerary(row.itinerary); setSavedId(row.id); setSelectedDay(0); setEditing(null); setError(''); setSaveNotice('');
    requestAnimationFrame(() => itineraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function startNewTrip() {
    setItinerary(null); setSavedId(null); setSelectedDay(0); setEditing(null); setSaveNotice(''); setError('');
    document.querySelector('#planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return <main className="wayfarer" id="top">
    <SiteHeader user={user} onSignOut={signOut}/>
    {error && <div className="page-alert" role="alert"><Icon name="compass" size={17}/><span>{error}</span><button aria-label="Dismiss message" onClick={() => setError('')}><Icon name="close" size={16}/></button></div>}
    {saveNotice && <div className="page-status" role="status"><Icon name="check" size={16}/>{saveNotice}<button aria-label="Dismiss message" onClick={() => setSaveNotice('')}><Icon name="close" size={15}/></button></div>}
    <section className="hero-section">
      <div className="hero-copy"><SectionKicker number="A WAYFARER JOURNAL">TRAVEL, THOUGHTFULLY</SectionKicker><h1>Go where<br/>the day <em>opens up.</em></h1><p>Less time arranging the details. More room for the small, wonderful things that make a trip yours.</p><div className="hero-actions"><a className="button-primary" href="#planner">Plan your next trip <Icon name="arrow" size={17}/></a><a className="hero-secondary" href="#journey">A little about us <span>↓</span></a></div><div className="hero-signoff"><span className="signoff-line"/>A good trip begins with a feeling.</div></div>
      <figure className="hero-art"><CoastScene/><figcaption><span>THE SLOW ROAD</span><span>AMALFI COAST · ITALY</span></figcaption><div className="art-index">40°37′ N<br/>14°36′ E</div><div className="art-edition">A FIELD NOTE<br/><b>NO. 01</b></div></figure>
      <div className="hero-side-note"><span>THE ART OF<br/>GETTING THERE</span><span className="vertical-rule"/><span>Made for the way<br/>you want to feel.</span></div>
    </section>
    <div className="marquee-band" aria-label="Thoughtful trips, made personal"><span>THOUGHTFUL TRIPS</span><i>✳</i><span>MADE PERSONAL</span><i>✳</i><span>ROOM TO WANDER</span><i>✳</i><span>THOUGHTFUL TRIPS</span></div>
    <Inspiration onChoose={destination => { updateTrip('destination', destination); document.querySelector('#planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}/>
    <HowItWorks/>
    <TripForm trip={trip} setTrip={setTrip} onSubmit={generate} busy={busy}/>
    {busy && <div className="generation-state" role="status"><span className="generation-orbit"><i/><i/><i/></span><div><span className="micro-label">GIVE US A MOMENT</span><p>Finding a good rhythm for {trip.destination || 'your trip'}…</p></div></div>}
    {itinerary && <div ref={itineraryRef}><ItineraryView itinerary={itinerary} trip={trip} busy={busy} selectedDay={selectedDay} setSelectedDay={setSelectedDay} editing={editing} setEditing={setEditing} onRegenerate={regenerateDay} onCommitDay={commitDayEdit} onNewTrip={startNewTrip} onSave={persistTrip} savedId={savedId} user={user}/></div>}
    {user && savedLoading && <div className="saved-loading" role="status"><span className="button-spinner"/>Opening your travel journal…</div>}
    <AccountSection user={user} saved={saved} email={email} setEmail={setEmail} password={password} setPassword={setPassword} authMode={authMode} setAuthMode={mode => { setAuthMode(mode); setError(''); setAuthNotice(''); }} authBusy={authBusy} authNotice={authNotice} error={''} onAuth={submitAuth} onSignOut={signOut} onLoad={openTrip} onDelete={deleteTrip} onPlan={startNewTrip}/>
    <footer className="site-footer"><a className="wordmark" href="#top"><span className="wordmark-symbol">W</span><span>wayfarer<small>TRAVEL, THOUGHTFULLY</small></span></a><p>Here’s to going a little further<br/>and noticing a little more.</p><div className="footer-links"><a href="#inspiration">Find a little inspiration</a><a href="#planner">Start planning</a><a href="#saved">Your travel journal</a></div><div className="footer-bottom"><span>© Wayfarer · Made for the joy of getting there.</span><a href="#top">Back to the beginning ↑</a></div></footer>
  </main>;
}
