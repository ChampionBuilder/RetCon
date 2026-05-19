import { useEffect } from "react";

type AboutDialogProps = {
  onClose: () => void;
};

export function AboutDialog({ onClose }: AboutDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="About"
        aria-modal="true"
        className="selection-dialog about-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="selection-dialog__header">
          <div>
            <h3>About</h3>
            <p>Project credits and legal notes</p>
          </div>
          <button className="dialog-close" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="about-dialog__content">
          <section>
            <h4>RetCon</h4>
            <p>
              RetCon is a modern character planner for{" "}
              <a
                href="http://www.champions-online.com/"
                rel="noreferrer"
                target="_blank"
              >
                Champions Online
              </a>{" "}
              players, designed for long-term community maintenance and
              expansion.
            </p>
            <p>
              At the core of the project is a freely accessible database
              intended to be maintained and expanded by the community over
              time. It is publicly available and may be reused by anyone for
              their own tools or projects.
            </p>
            <p>
              <a
                href="https://docs.google.com/spreadsheets/d/1NHZ0smilWfqULr17W9ythxLwY4m7Ac9v2-eGWdUFXf8/edit?usp=sharing"
                rel="noreferrer"
                target="_blank"
              >
                Database spreadsheet
              </a>
            </p>
            <p>
              <a
                href="https://github.com/ChampionBuilder/RetCon"
                rel="noreferrer"
                target="_blank"
              >
                GitHub repository
              </a>
            </p>
            <p>
              The RetCon source code is distributed under the GNU GPL 3.0
              license. It is provided in the hope that it will be useful, but
              without warranty.
            </p>
            <p>
              RetCon is looking for contributors to help maintain and improve
              both the project and its database over time.
            </p>
          </section>

          <section>
            <h4>Special Thanks</h4>
            <p>
              RetCon builds upon the work of the community tools that came before it,
              and would not exist without the years of documentation, testing,
              and knowledge shared by Champions Online players.
            </p>
            <p>
              Special thanks to Aesica for the colossal work accomplished on HeroCreator,
              and to 0ccult, BalakfangKnight, the Champions Online development team,
              and ongoing community projects whose resources, documentation, and maintenance
              work greatly helped reconstruct and consolidate the project database.
            </p>
            <p>Please also visit and support the following community projects:</p>
            <ul>
              <li>
                <a
                  href="https://woof-wolf.github.io/powerhouse/index.html"
                  rel="noreferrer"
                  target="_blank"
                >
                  PowerHouse
                </a>{" "}
                by BehemothKing
              </li>
              <li>
                <a
                  href="https://vtwind.github.io/HeroBuilder/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Winds Hero Builder
                </a>{" "}
                by Winds
              </li>
            </ul>
            <p>Older community projects:</p>            
            <ul>
              <li>
                <a
                  href="https://aesica.net/co/herocreator.htm"
                  rel="noreferrer"
                  target="_blank"
                >
                  HeroCreator
                </a>{" "}
                by Aesica
              </li>              
              <li>
                <a
                  href="http://powerhouse.nullware.com/"
                  rel="noreferrer"
                  target="_blank"
                >
                  PowerHouse
                </a>{" "}
                by Kyle W. T. Sherman
              </li>
              <li>
                championBuilder by Moritz Hartmeier, later maintained by
                Roxstar
              </li>
             </ul>

          </section>

          <section>
            <h4>Game Content</h4>
            <p>
              Text descriptions, graphics, and other Champions Online assets are
              copyright 2009-2026 Cryptic Studios, Inc. and are used for the
              purposes of this non-commercial community project.
            </p>
            <p>
              Champions Online is a registered trademark of Cryptic Studios,
              Inc. Champions Online and all related content are copyright
              2009-2026 Cryptic Studios, Inc. All rights reserved.
            </p>
            <p>
              <a
                href="https://account.arcgames.com/en/about/terms"
                rel="noreferrer"
                target="_blank"
              >
                Arc Games Terms of Service
              </a>
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
