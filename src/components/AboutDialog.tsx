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
            <p>Project history and legal notes</p>
          </div>
          <button className="dialog-close" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="about-dialog__content">
          <section>
            <h4>PowerHouse</h4>
            <p>
              PowerHouse is an HTML/Javascript character planner for{" "}
              <a
                href="http://www.champions-online.com/"
                rel="noreferrer"
                target="_blank"
              >
                Champions Online
              </a>{" "}
              players.
            </p>
            <p>
              It is similar to and inspired by{" "}
              <a
                href="http://extantforce.com/championBuilder.htm"
                rel="noreferrer"
                target="_blank"
              >
                championBuilder
              </a>
              , written by Moritz Hartmeier and maintained by Roxstar, which is
              a Java application that performs a similar function.
            </p>
            <p>Copyright 2010-2016 Kyle W. T. Sherman.</p>
          </section>

          <section>
            <h4>Links</h4>
            <p>
              <a
                href="http://powerhouse.nullware.com"
                rel="noreferrer"
                target="_blank"
              >
                Kyle Sherman's Website
              </a>
            </p>
            <p>
              <a
                href="https://github.com/woof-wolf/powerhouse"
                rel="noreferrer"
                target="_blank"
              >
                PowerHouse on GitHub
              </a>
            </p>
          </section>

          <section>
            <h4>Game Content</h4>
            <p>
              Text descriptions and graphics are copyright 2009 Cryptic
              Studios, Inc. and are used as per their terms of service.
            </p>
            <p>
              Champions Online is a registered trademark of Cryptic Studios,
              Inc. Champions Online and all related content is copyright 2009
              Cryptic Studios, Inc. All rights reserved.
            </p>
            <p>
              <a
                href="http://www.champions-online.com/terms_of_service"
                rel="noreferrer"
                target="_blank"
              >
                Champions Online Terms of Service
              </a>
            </p>
          </section>

          <section>
            <h4>License</h4>
            <p>
              This program is free software: you can redistribute it and/or
              modify it under the terms of the GNU General Public License as
              published by the Free Software Foundation, either version 3 of
              the License, or any later version.
            </p>
            <p>
              This program is distributed in the hope that it will be useful,
              but without any warranty; without even the implied warranty of
              merchantability or fitness for a particular purpose.
            </p>
            <p>
              <a
                href="https://www.gnu.org/licenses/"
                rel="noreferrer"
                target="_blank"
              >
                GNU General Public License
              </a>
            </p>
          </section>

          <section>
            <h4>Thanks</h4>
            <p>
              Special thanks to{" "}
              <a
                href="http://champions-online-wiki.com/wiki/User:Lohr"
                rel="noreferrer"
                target="_blank"
              >
                Lohr
              </a>{" "}
              and all of the contributors at{" "}
              <a
                href="http://champions-online-wiki.com/"
                rel="noreferrer"
                target="_blank"
              >
                Champions Online Wiki
              </a>{" "}
              for their hard work.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
