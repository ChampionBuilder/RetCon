type AppHeaderProps = {
  buildName: string;
  shareUrl: string;
  resetSuperStatsDisabled: boolean;
  onBuildNameChange: (name: string) => void;
  onOpenAbout: () => void;
  onOpenBuildCheck: () => void;
  onOpenData: () => void;
  onSave: () => void;
  onResetAll: () => void;
  onResetSuperStats: () => void;
  onResetTalents: () => void;
  onResetPowers: () => void;
  onResetTravelPowers: () => void;
  onResetPowerVariants: () => void;
  onResetDevices: () => void;
  onResetAdvantages: () => void;
  onResetSpecializations: () => void;
  onRandomize: () => void;
};

export function AppHeader({
  buildName,
  shareUrl,
  resetSuperStatsDisabled,
  onBuildNameChange,
  onOpenAbout,
  onOpenBuildCheck,
  onOpenData,
  onSave,
  onResetAll,
  onResetSuperStats,
  onResetTalents,
  onResetPowers,
  onResetTravelPowers,
  onResetPowerVariants,
  onResetDevices,
  onResetAdvantages,
  onResetSpecializations,
  onRandomize,
}: AppHeaderProps) {
  function copyLink() {
    void navigator.clipboard?.writeText(shareUrl);
  }

  return (
    <header className="app-header">
      <div className="app-header__top">
        <div className="brand-row">
          <h1>RetCon</h1>
          <nav className="top-tabs" aria-label="Main sections">
            <button
              className="header-action-button"
              title="Open your saved builds and manage your collection."
              type="button"
              onClick={onOpenData}
            >
              My Builds
            </button>
            <button
              className="header-action-button"
              title="View project credits, sources, and acknowledgements."
              type="button"
              onClick={onOpenAbout}
            >
              About
            </button>
          </nav>
        </div>
      </div>

      <div className="app-header__controls">
        <label className="name-field">
          <span>Name :</span>
          <input
            value={buildName}
            onChange={(event) => onBuildNameChange(event.target.value)}
          />
        </label>

        <button
          className="header-action-button"
          title="Copy a link to share this build."
          type="button"
          onClick={copyLink}
        >
          Copy Link
        </button>
        <button
          className="header-action-button"
          title="Save this build to My Builds."
          type="button"
          onClick={onSave}
        >
          Save
        </button>
        <button
          className="header-action-button"
          title="Check whether this build includes the core power types."
          type="button"
          onClick={onOpenBuildCheck}
        >
          Check Build
        </button>

        <div className="reset-bar" aria-label="Reset build sections">
          <span>Reset :</span>
          <button className="reset-button" onClick={onResetAll}>
            All
          </button>
          <button
            className="reset-button"
            disabled={resetSuperStatsDisabled}
            onClick={onResetSuperStats}
          >
            Super Stats
          </button>
          <button className="reset-button" onClick={onResetTalents}>
            Talents
          </button>
          <button className="reset-button" onClick={onResetTravelPowers}>
            Travel Powers
          </button>
          <button className="reset-button" onClick={onResetSpecializations}>
            Specializations
          </button>
          <button className="reset-button" onClick={onResetPowers}>
            Powers
          </button>
          <button className="reset-button" onClick={onResetPowerVariants}>
            Power Variants
          </button>
          <button className="reset-button" onClick={onResetDevices}>
            Devices
          </button>
          <button className="reset-button" onClick={onResetAdvantages}>
            Advantages
          </button>
        </div>

        <button className="randomize-button" type="button" onClick={onRandomize}>
          Randomize
        </button>
      </div>
    </header>
  );
}
