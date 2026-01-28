import { useState } from "react";

export function Tabs({ tabs, defaultValue }) {
  const [activeValue, setActiveValue] = useState(defaultValue || tabs[0].value);

  const activeTab = tabs.find((t) => t.value === activeValue);

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab Headers */}
      <div className="flex bg-[#2a2a2a] border-b border-gray-700" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveValue(tab.value)}
            className={`px-4 py-2 ${activeValue === tab.value ? "text-white border-b-2 border-blue-500" : "text-gray-400"
              }`}
            role="tab"
            aria-selected={activeValue === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-[#1e1e1e]" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
