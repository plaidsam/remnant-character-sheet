import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Heart, Flame, Brain, Shield, Compass, Upload } from 'lucide-react';

// --- CONFIGURATION & CONSTANTS ---
const LOCAL_STORAGE_KEY = 'lotr_react_character_data';
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

// --- HELPER COMPONENTS ---

// Component for a standard text or textarea input field
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

// Component for Grace, Fear, and Fury Meters
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

// Function to toggle stress state
const toggleStress = (quadrant, index, currentStress, onChange) => {
    const newStress = [...currentStress];
    newStress[index] = !newStress[index];
    onChange({ target: { name: `${quadrant.toLowerCase()}Stress`, value: newStress } });
};


// Component combining Skill Selector, Aspect, and Stress Tracker
const QuadrantBlock = ({ quadrantName, skillValue, aspectValue, stressValues, onChange, themeColor }) => {
    const Icon = skillIcons[quadrantName];
    
    // Aesthetic Change: Use consistent 400-level colors for borders and text accents
    const mainBorderColor = themeColor === 'blue' ? 'border-blue-400' : 'border-red-400';
    const mainTextColor = themeColor === 'blue' ? 'text-blue-400' : 'text-red-400';
    
    // FIX: Change skill selector background to 400 color for consistency
    const skillBgColor = themeColor === 'blue' ? 'bg-blue-400' : 'bg-red-400'; 
    // Use dark text for high contrast on the lighter 400 background
    const skillTextColor = 'text-gray-900'; 

    return (
        // Outer border changed to match Fear/Fury (400-level)
        <div className={`p-4 bg-gray-900/50 rounded-xl transition-all border-2 ${mainBorderColor} shadow-inner`}>
            
            {/* Quadrant Header: Icon, Name, Stress Boxes, and Score Selector */}
            <div className={`flex items-center justify-between p-3 rounded-xl transition-all border-2 mb-4 ${mainBorderColor}`}>
                
                <div className="flex items-center">
                    <Icon className={`w-6 h-6 ${mainTextColor} mr-3`} />
                    <span className="font-extrabold text-xl text-white uppercase tracking-wider mr-4">{quadrantName}</span>
                </div>
                
                {/* Stress Tracker and Score Selector Group */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
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
                    
                    {/* Skill Selector (Score) */}
                    <select
                        name={quadrantName}
                        value={skillValue}
                        onChange={onChange}
                        // UPDATED: Use skillBgColor (400) and skillTextColor (dark)
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
                    // CRITICAL FIX: Ensure ID (which becomes the name) matches the lowercase state key.
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

// Component for handling local image file selection and display
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

// --- MAIN APP COMPONENT ---

const App = () => {
  const [sheetData, setSheetData] = useState(initialSheetData);

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
      console.error("Could not load state from local storage", e);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheetData));
      } catch (e) {
        console.error("Could not save state to local storage", e);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [sheetData]);

  // --- Handlers ---
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Handle array updates from StressTracker (which passes an array as 'value')
    if (name.endsWith('Stress') && Array.isArray(value)) {
      newValue = value;
    } 
    // Handle numeric updates (Skills, Grace, Fear, Fury)
    else if (numericKeys.includes(name)) {
      newValue = parseInt(value, 10);
    }
    
    // Name now correctly matches the state key, whether it's 'Heart', 'grace', or 'heartAspect'
    setSheetData(prev => ({
      ...prev,
      [name]: newValue
    }));
  }, []);

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
      <div className="w-full max-w-6xl bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-10 border-t-8 border-cyan-400 transition-shadow">
        
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
          
          {/* ALLOCATION RULE */}
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
          
          {/* STUNT & FEAR/FURY METERS */}
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

          {/* NOTES */}
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
        
        {/* COPYRIGHT STATEMENT - Updated to use &copy; symbol */}
        <p className="text-center text-xs text-gray-500 mt-10">
            Legacy of the Covenant is &copy; 2025 Open Almond Studios, LLC. All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default App;
