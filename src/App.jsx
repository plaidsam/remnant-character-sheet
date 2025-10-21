import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Heart, Flame, Brain, Shield, Compass, Upload, Menu, X } from 'lucide-react';

// --- CONFIGURATION & CONSTANTS ---
const LOCAL_STORAGE_KEY = 'lotr_react_character_data';
const SHEET_COLLECTION_KEY = 'lotr_react_character_sheets';
const skillOptions = [0, 1, 2, 3];

const PLACEHOLDERS = {
  characterName: 'Elias "The Shepherd" Vance',
  appearance: 'Wears reinforced utility gear and a patched ballistic vest, always carries a worn copy of the book of Revelation.',
  flaw: 'His faith wavers when faced with undeniable evidence of the corruption of the higher powers.',
  verse: 'Revelation 21:4',
  stunt: 'Apostolic Zeal: Invoke divine intervention to briefly suppress a supernatural effect or creature\'s presence.',
  notes: 'Write tracked aspects here',
  heartAspect: 'What drives you to keep going, and what have you learned to do because of it?',
  soulAspect: 'What truth or belief keeps you steady, and how does it show in how you live?',
  mindAspect: 'What doubt or fear do you wrestle with, and what skill helps you stay focused?',
  strengthAspect: 'What hardship shaped you, and what can you do now that helps you survive?',
};

const initialSkills = { Heart: 0, Soul: 0, Mind: 0, Strength: 0 };
const initialStress = {
  heartStress: [false, false, false],
  soulStress: [false, false, false],
  mindStress: [false, false, false],
  strengthStress: [false, false, false],
};

const numericKeys = [...Object.keys(initialSkills), 'grace', 'fear', 'fury'];

const initialSheetData = {
  characterName: '',
  playerName: '',
  appearance: '',
  flaw: '',
  verse: '',
  stunt: '',
  notes: '',
  grace: 3,
  fear: 0,
  fury: 0,
  characterImage: null,
  ...initialSkills,
  heartAspect: '',
  soulAspect: '',
  mindAspect: '',
  strengthAspect: '',
  ...initialStress,
};

const skillIcons = {
  Heart: Heart,
  Soul: Flame,
  Mind: Brain,
  Strength: Shield,
};

// --- SHEET MANAGEMENT HELPERS ---

function getAllSheets() {
  try {
    const raw = localStorage.getItem(SHEET_COLLECTION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSheetToCollection(name, data) {
  const sheets = getAllSheets();
  sheets[name] = data;
  localStorage.setItem(SHEET_COLLECTION_KEY, JSON.stringify(sheets));
}

function deleteSheetFromCollection(name) {
  const sheets = getAllSheets();
  delete sheets[name];
  localStorage.setItem(SHEET_COLLECTION_KEY, JSON.stringify(sheets));
}

function getSheetFromCollection(name) {
  const sheets = getAllSheets();
  return sheets[name] || null;
}

// --- HELPER COMPONENTS ---

const TextInput = ({ label, id, value, onChange, rows = 1, placeholder = '' }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-xs font-semibold uppercase text-cyan-400 mb-1">{label}</label>
    {rows > 1 ? (
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 bg-gray-900 text-white border-b-2 border-teal-700 rounded-t-lg focus:border-cyan-500 focus:ring-0 resize-none transition duration-150 shadow-inner"
      />
    ) : (
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-900 text-white border-b-2 border-teal-700 rounded-t-lg focus:border-cyan-500 focus:ring-0 transition duration-150 shadow-inner"
      />
    )}
  </div>
);

const MeterSelector = ({ name, max, value, onChange, colorClass }) => (
  <div className="flex flex-col items-center">
    <div className={`w-24 h-12 rounded-full border-4 flex items-center justify-center shadow-2xl relative ${colorClass.border} ${colorClass.bg}`}>
      <select
        name={name.toLowerCase()} 
        value={String(value)} 
        onChange={onChange}
        className={`w-full h-full text-center font-extrabold text-2xl bg-transparent appearance-none cursor-pointer border-none focus:outline-none ${colorClass.text}`}
      >
        {Array.from({ length: max + 1 }, (_, i) => i).map(option => (
          <option 
            key={option} 
            value={String(option)}
          >
            {option}/{max}
          </option>
        ))}
      </select>
    </div>
    <span className={`text-xl font-bold mt-2 uppercase ${colorClass.text}`}>{name}</span>
  </div>
);

const toggleStress = (quadrant, index, currentStress, onChange) => {
  const newStress = [...currentStress];
  newStress[index] = !newStress[index];
  onChange({ target: { name: `${quadrant.toLowerCase()}Stress`, value: newStress } });
};

const QuadrantBlock = ({ quadrantName, skillValue, aspectValue, stressValues, onChange, themeColor }) => {
  const Icon = skillIcons[quadrantName];
  const mainBorderColor = themeColor === 'blue' ? 'border-blue-400' : 'border-red-400';
  const mainTextColor = themeColor === 'blue' ? 'text-blue-400' : 'text-red-400';
  const skillBgColor = themeColor === 'blue' ? 'bg-blue-400' : 'bg-red-400'; 
  const skillTextColor = 'text-gray-900'; 

  return (
    <div className={`p-4 bg-gray-900/50 rounded-xl transition-all border-2 ${mainBorderColor} shadow-inner`}>
      {/* Responsive Header: stacks on mobile, row on desktop */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl transition-all border-2 mb-4 ${mainBorderColor}`}>
        {/* Attribute Icon and Name */}
        <div className="flex items-center mb-2 sm:mb-0">
          <Icon className={`w-6 h-6 ${mainTextColor} mr-3`} />
          <span className="font-extrabold text-xl text-white uppercase tracking-wider mr-4">{quadrantName}</span>
        </div>
        {/* Stress boxes and score selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2">
          <div className="flex items-center space-x-2 justify-center">
            {stressValues.map((isStressed, index) => (
              <div
                key={index}
                className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors cursor-pointer 
                  ${isStressed ? 'bg-red-600 border-red-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                onClick={() => toggleStress(quadrantName, index, stressValues, onChange)}
                title={`Stress Box ${index + 1}`}
              >
                {isStressed && <Sparkles className="w-3 h-3 text-white" />}
              </div>
            ))}
          </div>
          <select
            name={quadrantName}
            value={skillValue}
            onChange={onChange}
            className={`px-5 py-2 border ${mainBorderColor} rounded-full ${skillBgColor} ${skillTextColor} text-lg font-bold focus:ring-cyan-400 focus:border-cyan-400 transition duration-150 ease-in-out cursor-pointer appearance-none text-center shadow-lg`}
          >
            {skillOptions.map(option => (
              <option key={option} value={option}>
                +{option}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Aspect Question/Answer */}
      <div className={`mt-4 border-t ${mainBorderColor} pt-4`}>
        <TextInput
          label="Aspect"
          id={`${quadrantName.toLowerCase()}Aspect`} 
          value={aspectValue} 
          onChange={onChange}
          rows={3} 
          placeholder={PLACEHOLDERS[`${quadrantName.toLowerCase()}Aspect`]} 
        />
      </div>
    </div>
  );
};

const ImageUploader = ({ value, onChange }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ target: { name: 'characterImage', value: reader.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full relative h-full flex flex-col items-center justify-center min-h-[150px]">
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="image-upload"
        className={`w-full h-full bg-gray-700 rounded-lg flex flex-col items-center justify-center text-sm text-gray-400 border border-dashed border-gray-600 cursor-pointer overflow-hidden transition-all duration-300 hover:border-cyan-400 hover:bg-gray-700/80 ${value ? 'p-0' : 'p-4'}`}
      >
        {value ? (
          <img src={value} alt="Character Sigil" className="object-cover w-full h-full" />
        ) : (
          <>
            <Upload className="w-8 h-8 text-cyan-400 mb-1" />
            <span>Click to Upload Portrait</span>
          </>
        )}
      </label>
    </div>
  );
};

// --- SIDEBAR FOR SHEET MANAGEMENT ---

const SheetSidebar = ({
  open, onClose,
  savedSheets,
  onLoad, onDelete,
  currentSheetName,
}) => (
  <div className={`fixed top-0 left-0 h-full w-80 bg-gray-900 border-r-2 border-cyan-700 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-700">
      <h2 className="text-xl font-extrabold text-cyan-400">Saved Sheets</h2>
      <button onClick={onClose} aria-label="Close Sidebar"><X className="w-6 h-6 text-white" /></button>
    </div>
    <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
      {Object.keys(savedSheets).length === 0 && (
        <div className="text-gray-400 text-center mt-16">No saved character sheets yet.</div>
      )}
      {Object.entries(savedSheets).map(([name, sheet]) => (
        <div key={name} className={`flex items-center justify-between mb-4 p-2 rounded-lg ${name === currentSheetName ? 'bg-cyan-900/40' : 'bg-gray-800/60'}`}>
          <div className="flex-1 cursor-pointer" onClick={() => onLoad(name)}>
            <div className="font-bold text-white truncate">{name}</div>
            <div className="text-xs text-gray-400 truncate">{sheet.characterName || <em>No character name</em>}</div>
          </div>
          <button
            className="ml-2 p-2 rounded bg-red-700 hover:bg-red-800 text-white"
            title="Delete"
            onClick={() => {
              if (window.confirm(`Delete saved sheet "${name}"?`)) onDelete(name);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

const App = () => {
  const [sheetData, setSheetData] = useState(initialSheetData);
  const [currentSheetName, setCurrentSheetName] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedSheets, setSavedSheets] = useState({});
  const [savePrompt, setSavePrompt] = useState(false);
  const [saveName, setSaveName] = useState('');

  // --- Persistence (Load and Save) ---
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const loadedData = JSON.parse(savedData);
        numericKeys.forEach(key => {
          if (loadedData[key] !== undefined) loadedData[key] = parseInt(loadedData[key], 10);
        });
        setSheetData(prev => ({ ...prev, ...loadedData }));
      }
    } catch (e) {
      // ignore
    }
    setSavedSheets(getAllSheets());
  }, []);

  // Save current sheet to "default" for auto-restore on reload
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheetData));
      } catch (e) {}
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [sheetData]);

  // --- Handlers ---
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name.endsWith('Stress') && Array.isArray(value)) {
      newValue = value;
    } else if (numericKeys.includes(name)) {
      newValue = parseInt(value, 10);
    }
    setSheetData(prev => ({
      ...prev,
      [name]: newValue
    }));
  }, []);

  const handleSaveAs = () => {
    setSavePrompt(true);
    setSaveName(currentSheetName || '');
  };

  const doSave = (name) => {
    if (!name.trim()) return;
    saveSheetToCollection(name.trim(), sheetData);
    setSavedSheets(getAllSheets());
    setCurrentSheetName(name.trim());
    setSavePrompt(false);
  };

  const handleLoad = (name) => {
    const loaded = getSheetFromCollection(name);
    if (loaded) {
      setSheetData(loaded);
      setCurrentSheetName(name);
      setSidebarOpen(false);
    }
  };

  const handleDelete = (name) => {
    deleteSheetFromCollection(name);
    setSavedSheets(getAllSheets());
    if (currentSheetName === name) {
      setCurrentSheetName(null);
      setSheetData(initialSheetData);
    }
  };

  const handleOverwrite = () => {
    if (currentSheetName) {
      saveSheetToCollection(currentSheetName, sheetData);
      setSavedSheets(getAllSheets());
    }
  };

  // --- Skill Validation Logic (useMemo for performance) ---
  const validation = useMemo(() => {
    const skills = { Heart: sheetData.Heart, Soul: sheetData.Soul, Mind: sheetData.Mind, Strength: sheetData.Strength };
    const values = Object.values(skills).filter(v => v > 0);
    const totalPoints = values.reduce((sum, val) => sum + val, 0);
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, { 0: 4 - values.length });
    const isValidDistribution = (
      counts[1] === 1 && counts[2] === 2 && counts[3] === 1
    );
    return {
      isValidDistribution: (totalPoints === 8 && isValidDistribution),
    };
  }, [sheetData.Heart, sheetData.Soul, sheetData.Mind, sheetData.Strength]);

  const quadrants = [
    { name: 'Heart', theme: 'blue' },
    { name: 'Soul', theme: 'red' },
    { name: 'Mind', theme: 'blue' },
    { name: 'Strength', theme: 'red' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 font-sans p-4 flex items-center justify-center">
      {/* Sidebar */}
      <SheetSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        savedSheets={savedSheets}
        onLoad={handleLoad}
        onDelete={handleDelete}
        currentSheetName={currentSheetName}
      />
      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed top-0 left-0 w-full h-full bg-black/30 z-30"
        />
      )}
      <div className="w-full max-w-6xl bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-10 border-t-8 border-cyan-400 transition-shadow relative">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-4">
          <button
            className="p-2 md:hidden rounded bg-cyan-900 text-cyan-300 hover:bg-cyan-700"
            onClick={() => setSidebarOpen(true)}
            title="Open Saved Sheets"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <span className="text-sm text-cyan-400 font-semibold">
              {currentSheetName ? <>Editing: <span className="text-white">{currentSheetName}</span></> : ""}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm"
              onClick={handleSaveAs}
              title="Save As New Sheet"
            >
              Save As…
            </button>
            <button
              className="px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm"
              onClick={handleOverwrite}
              disabled={!currentSheetName}
              title="Overwrite Current Sheet"
            >
              Save
            </button>
            <button
              className="px-4 py-2 rounded bg-cyan-800 hover:bg-cyan-700 text-cyan-200 font-bold text-sm md:inline hidden"
              onClick={() => setSidebarOpen(true)}
              title="Show Saved Sheets"
            >
              Load…
            </button>
          </div>
        </div>
        {/* Save prompt modal */}
        {savePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-gray-900 p-6 rounded-lg shadow-2xl border-2 border-cyan-700 w-full max-w-xs">
              <h3 className="text-cyan-300 font-bold mb-2">Save Sheet As…</h3>
              <input
                type="text"
                className="w-full p-2 rounded mb-4 bg-gray-800 text-white border border-cyan-600 focus:outline-none"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Enter a name for this sheet"
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-gray-200"
                  onClick={() => setSavePrompt(false)}
                >Cancel</button>
                <button
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                  disabled={!saveName.trim()}
                  onClick={() => doSave(saveName)}
                >Save</button>
              </div>
            </div>
          </div>
        )}
        {/* Main sheet UI */}
        {/* HEADER & CORE INFO GRID - Names, Appearance, Grace, Image */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-9">
            <h1 className="text-5xl font-extrabold text-white mb-1 tracking-tight">
              LEGACY OF THE REMNANT
            </h1>
            <p className="text-xl font-semibold text-cyan-400 mb-4 tracking-wider">CHARACTER SHEET</p>
            {/* Sub-grid for Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput 
                  label="Character Name" 
                  id="characterName" 
                  value={sheetData.characterName} 
                  onChange={handleChange} 
                  rows={1}
                  placeholder={PLACEHOLDERS.characterName}
                />
                 <TextInput 
                  label="Player Name" 
                  id="playerName" 
                  value={sheetData.playerName} 
                  onChange={handleChange} 
                  rows={1}
                />
            </div>
            <TextInput 
              label="Appearance / Description" 
              id="appearance" 
              value={sheetData.appearance} 
              onChange={handleChange} 
              rows={5}
              placeholder={PLACEHOLDERS.appearance}
            />
          </div>
          {/* Right Column: Grace and Image (Col 10-12) */}
          <div className="md:col-span-3 flex flex-col items-center justify-between p-4 bg-gray-900 rounded-xl border-2 border-teal-700 shadow-xl">
            {/* GRACE METER */}
            <MeterSelector
                name="Grace"
                max={3}
                value={sheetData.grace}
                onChange={handleChange}
                colorClass={{ border: 'border-teal-400', text: 'text-teal-400', bg: 'bg-gray-800' }}
            />
            {/* IMAGE UPLOADER */}
            <div className="flex-grow w-full mt-4 h-full min-h-[225px] flex items-center justify-center">
                <ImageUploader
                    value={sheetData.characterImage}
                    onChange={handleChange}
                />
            </div>
          </div>
        </div>
        {/* FLAW / VERSE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
                <TextInput 
                  label="Flaw (A significant weakness or failing)" 
                  id="flaw" 
                  value={sheetData.flaw} 
                  onChange={handleChange} 
                  rows={1} 
                  placeholder={PLACEHOLDERS.flaw}
                />
            </div>
            <div className="md:col-span-1">
                <TextInput 
                  label="Favorite Verse" 
                  id="verse" 
                  value={sheetData.verse} 
                  onChange={handleChange} 
                  rows={1} 
                  placeholder={PLACEHOLDERS.verse}
                />
            </div>
        </div>
        {/* SKILL QUADRANTS & ALLOCATION RULE */}
        <div className="p-6 bg-gray-700/30 rounded-xl mb-8 border-2 border-teal-700 shadow-inner">
          <h2 className="text-2xl font-extrabold text-white mb-4 flex items-center border-b border-cyan-500 pb-2">
            <Compass className="w-6 h-6 text-cyan-400 mr-3" />
            CHARACTER COMPASS
          </h2>
          {!validation.isValidDistribution && (
            <p className="text-gray-300 mb-6 font-semibold">
              Allocation Rule: You must have exactly one <span className="text-white font-bold">+1</span>, two <span className="text-white font-bold">+2s</span>, and one <span className="text-white font-bold">+3</span>.
            </p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quadrants.map(({ name, theme }) => (
                <QuadrantBlock
                    key={name}
                    quadrantName={name}
                    skillValue={sheetData[name]}
                    aspectValue={sheetData[`${name.toLowerCase()}Aspect`]}
                    stressValues={sheetData[`${name.toLowerCase()}Stress`]}
                    onChange={handleChange}
                    themeColor={theme}
                />
            ))}
          </div>
        </div>
        {/* STUNT / METERS / NOTES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <TextInput 
              label="Signature Stunt" 
              id="stunt" 
              value={sheetData.stunt} 
              onChange={handleChange} 
              rows={5} 
              placeholder={PLACEHOLDERS.stunt}
            />
            <div className="flex justify-around items-center mt-6 p-6 bg-gray-700/30 rounded-xl border-2 border-teal-700 shadow-inner">
                <MeterSelector
                    name="Fear"
                    max={5}
                    value={sheetData.fear}
                    onChange={handleChange}
                    colorClass={{ border: 'border-blue-400', text: 'text-blue-400', bg: 'bg-gray-800' }}
                />
                <MeterSelector
                    name="Fury"
                    max={5}
                    value={sheetData.fury}
                    onChange={handleChange}
                    colorClass={{ border: 'border-red-400', text: 'text-red-400', bg: 'bg-gray-800' }}
                />
            </div>
          </div>
          <div>
            <TextInput 
              label="Notes"
              id="notes" 
              value={sheetData.notes} 
              onChange={handleChange} 
              rows={13} 
              placeholder={PLACEHOLDERS.notes}
            />
          </div>
        </div>
        {/* COPYRIGHT STATEMENT */}
        <p className="text-center text-xs text-gray-500 mt-10">
            Legacy of the Covenant is &copy; 2025 Open Almond Studios, LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default App;
