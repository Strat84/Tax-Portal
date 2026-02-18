'use client'

export default function QuestionnairePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-50">Questionnaire</h1>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <iframe
            src="https://pwk46wlp42n.typeform.com/to/l3IowWBY"
            width="100%"
            height="900"
            frameBorder="0"
            allow="camera; microphone; geolocation; encrypted-media"
            style={{ border: 'none', borderRadius: '8px' }}
          />
        </div>
      </div>
    </div>
  )
}
