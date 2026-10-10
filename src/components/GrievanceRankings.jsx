import React from 'react';

export default function GrievanceRankings({ 
  complaints, 
  onUpvote, 
  onSubmitGrievance, 
  formState 
}) {
  const { newTitle, setNewTitle, newWard, setNewWard, newCategory, setNewCategory, newDesc, setNewDesc } = formState;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-amber-950 tracking-tight">Citizen Grievance Rankings</h2>
          <p className="text-xs text-amber-800 mt-1">Community problems ranked dynamically by citizen upvotes.</p>
        </div>
        <span className="badge-vermicelli text-xs font-bold px-4 py-2 rounded-full shadow-sm">
          ● Live Voting Feed
        </span>
      </div>

      <form onSubmit={onSubmitGrievance} className="light-glass-panel rounded-3xl p-6 space-y-4">
        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">File a New Public Grievance</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Issue title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-white/80 text-xs rounded-xl px-4 py-2.5 text-amber-950 border border-amber-300 focus:outline-none focus:border-amber-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ward (e.g. Ward 42)"
              value={newWard}
              onChange={(e) => setNewWard(e.target.value)}
              className="bg-white/80 text-xs rounded-xl px-4 py-2.5 text-amber-950 border border-amber-300 w-1/2"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-white/80 text-xs rounded-xl px-3 py-2.5 text-amber-950 border border-amber-300 w-1/2 font-semibold"
            >
              <option>Sanitation</option>
              <option>Roads</option>
              <option>Water Supply</option>
              <option>Electricity</option>
            </select>
          </div>
        </div>
        <textarea
          placeholder="Detailed description of the issue..."
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="w-full bg-white/80 text-xs rounded-xl px-4 py-2.5 text-amber-950 border border-amber-300 focus:outline-none focus:border-amber-500"
          rows={2}
        />
        <button
          type="submit"
          className="badge-gold px-6 py-2.5 rounded-xl text-xs font-bold hover:opacity-95 shadow-sm cursor-pointer"
        >
          Submit Grievance to Ledger
        </button>
      </form>

      <div className="space-y-3">
        {complaints.map((item, index) => (
          <div 
            key={item._id || item.id || index}
            className="light-glass-panel rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-amber-400"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                index === 0 ? 'badge-vermicelli' : index === 1 ? 'badge-gold' : 'light-glass-inset text-amber-950 border border-amber-300'
              }`}>
                #{index + 1}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-amber-tint text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {item.category || 'General'}
                  </span>
                  <span className="text-xs font-mono text-amber-700 font-bold">
                    {item.ward || 'Ward 42'}
                  </span>
                  {index === 0 && (
                    <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Top Priority
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-amber-950 text-base">{item.title}</h4>
                <p className="text-xs text-amber-800 mt-1 max-w-2xl">{item.description}</p>
              </div>
            </div>

            <button
              onClick={() => onUpvote(item._id || item.id)}
              className="light-glass-inset px-5 py-3 rounded-2xl border border-amber-300 text-amber-900 hover:bg-amber-500 hover:text-white transition-all flex flex-col items-center justify-center min-w-[75px] cursor-pointer shadow-sm active:scale-95"
            >
              <span className="text-xs font-bold">▲ VOTE</span>
              <span className="text-base font-black">{item.upvotes || 0}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}