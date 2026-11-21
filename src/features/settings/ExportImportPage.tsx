import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadExport, exportAllData, importAllData } from '../../data/exportImport'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { getKeepAwake, getSoundEnabled, setKeepAwake, setSoundEnabled } from '../../lib/prefs'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DownloadIcon, PhoneIcon, SpeakerIcon, SunIcon, UploadIcon } from '../../components/icons'
import { Toggle } from '../../components/Toggle'

export function ExportImportPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [justImported, setJustImported] = useState(false)
  const install = useInstallPrompt()
  const [soundOn, setSoundOn] = useState(getSoundEnabled())
  const [keepAwakeOn, setKeepAwakeOn] = useState(getKeepAwake())

  async function handleExport() {
    setBusy(true)
    setMessage(null)
    setJustImported(false)
    try {
      const blob = await exportAllData()
      downloadExport(blob)
      setMessage({ text: 'Backup downloaded.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleImportConfirmed() {
    if (!pendingFile) return
    setBusy(true)
    try {
      await importAllData(pendingFile)
      setMessage({ text: 'Data imported successfully.' })
      setJustImported(true)
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Import failed.', error: true })
      setJustImported(false)
    } finally {
      setBusy(false)
      setPendingFile(null)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 space-y-5">
      <h1 className="font-display text-3xl tracking-wide">Settings</h1>

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">{PhoneIcon}</span>
          <h2 className="font-bold text-slate-200">Install app</h2>
        </div>
        {install.installed ? (
          <p className="text-sm text-slate-400">Already installed on this device. 🎉</p>
        ) : install.canPrompt ? (
          <>
            <p className="text-sm text-slate-400">Add Cric Stats to your home screen — full screen, its own icon, works offline.</p>
            <Button onClick={() => void install.promptInstall()}>Install on this device</Button>
          </>
        ) : install.isIos ? (
          <p className="text-sm text-slate-400">
            On iPhone/iPad: tap the <span className="text-slate-200 font-semibold">Share</span> button in Safari, then{' '}
            <span className="text-slate-200 font-semibold">Add to Home Screen</span>.
          </p>
        ) : (
          <p className="text-sm text-slate-400">Use your browser's menu (often "Install app" or "Add to Home screen") to install.</p>
        )}
      </Card>

      <Card className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">{SpeakerIcon}</span>
          <div>
            <h2 className="font-bold text-slate-200">Sound</h2>
            <p className="text-xs text-slate-400">Boundary and wicket celebration sounds</p>
          </div>
        </div>
        <Toggle
          checked={soundOn}
          label="Sound"
          onChange={(v) => {
            setSoundOn(v)
            setSoundEnabled(v)
          }}
        />
      </Card>

      <Card className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">{SunIcon}</span>
          <div>
            <h2 className="font-bold text-slate-200">Keep screen on</h2>
            <p className="text-xs text-slate-400">Stops the screen dimming while scoring a match</p>
          </div>
        </div>
        <Toggle
          checked={keepAwakeOn}
          label="Keep screen on"
          onChange={(v) => {
            setKeepAwakeOn(v)
            void setKeepAwake(v)
          }}
        />
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-bold text-slate-200">Export</h2>
        <p className="text-sm text-slate-400">
          Download everything — teams, players, fixtures, matches and photos — as a single .zip backup file.
        </p>
        <Button onClick={handleExport} disabled={busy}>
          <span className="inline-flex items-center gap-1.5">{DownloadIcon} Download backup</span>
        </Button>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-bold text-slate-200">Import</h2>
        <p className="text-sm text-slate-400">
          Load a backup from another device. <span className="text-amber-400">This replaces all data currently on
          this device</span> — export first if you want to keep it.
        </p>
        <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          <span className="inline-flex items-center gap-1.5">{UploadIcon} Choose backup file…</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.json,application/zip,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setPendingFile(file)
            e.target.value = ''
          }}
        />
      </Card>

      {message && (
        <p className={`text-sm ${message.error ? 'text-red-400' : 'text-emerald-400'}`}>{message.text}</p>
      )}

      {justImported && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/teams')}
            className="tap-target flex-1 py-3 rounded-xl font-bold text-black bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 shadow-[0_4px_16px_rgba(217,70,239,.45)] active:scale-[0.97] transition-transform"
          >
            Go to Teams
          </button>
          <button
            onClick={() => navigate('/fixtures')}
            className="tap-target flex-1 py-3 rounded-xl font-bold text-black bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_4px_16px_rgba(245,158,11,.45)] active:scale-[0.97] transition-transform"
          >
            Go to Fixtures
          </button>
        </div>
      )}

      {pendingFile && (
        <ConfirmDialog
          title="Replace all data?"
          message={`Importing "${pendingFile.name}" will erase all teams, players, fixtures and matches currently on this device and replace them with the backup's contents. This cannot be undone.`}
          confirmLabel="Replace data"
          danger
          onCancel={() => setPendingFile(null)}
          onConfirm={handleImportConfirmed}
        />
      )}
    </div>
  )
}
