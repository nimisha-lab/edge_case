import React from 'react';

export default function GrievanceRankings({
  complaints = [],
  grievances = [],
  onUpvote,
  onSubmitGrievance,
  formState
}) {
  const list = complaints && complaints.length > 0 ? complaints : (grievances || []);
  const sortedList = [...list].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

  const newTitle = formState?.newTitle || '';
  const setNewTitle = formState?.setNewTitle || (() => {});
  const newWard = formState?.newWard || '';
  const setNewWard = formState?.setNewWard || (() => {});
  const newCategory = formState?.newCategory || 'Roads';
  const setNewCategory = formState?.setNewCategory || (() => {});
  const newDesc = formState?.newDesc || '';
  const setNewDesc = formState?.setNewDesc || (() => {});

  return (
    <div className="space-y-6">
      {onSubmitGrievance && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-amber-200/60 shadow-sm">
          <h3 className="text-lg font-bold text-amber-950 mb-1">File a Public Grievance</h3>
          <p className="text-xs text-amber-800 mb-4">
            Issues submitted are published to the citizen leaderboard and prioritized by upvotes.
          </p>

          <form onSubmit={onSubmitGrievance} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Pothole on 4th Main"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></input>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Ward</label>
                  <input
                    type="text"
                    placeholder="Ward 12"
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  ></input>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Roads">Roads</option>
                    <option value="Water">Water</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Electricity">Electricity</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Describe the problem and exact location..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
            >
              Submit Grievance
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wide">
          Ranked Grievances ({sortedList.length})
        </h3>

        {sortedList.length === 0 ? (
          <div className="p-6 text-center text-amber-800/70 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 text-sm">
            No grievances submitted yet. File the first one above!
          </div>
        ) : (
          sortedList.map((item, index) => {
            const rank = index + 1;
            const itemId = item._id || item.id || `item-${index}`;

            return (
              <div
                key={itemId}
                className="flex items-start justify-between p-4 bg-white/90 border border-amber-100 rounded-2xl shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold shrink-0 ${
                      rank === 1
                        ? 'bg-amber-500 text-white shadow-sm'
                        : rank === 2
                        ? 'bg-amber-200 text-amber-900'
                        : rank === 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    #{rank}
                  </span>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
                        {item.category || 'General'}
                      </span>
                      {item.ward && (
                        <span className="text-xs text-amber-700/80 font-medium">
                          Ward: {item.ward}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-amber-950 mt-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUpvote && onUpvote(itemId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 text-xs font-bold transition-colors shrink-0 ml-4 cursor-pointer"
                >
                  <span>&#9650;</span>
                  <span>{item.upvotes || 0}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}