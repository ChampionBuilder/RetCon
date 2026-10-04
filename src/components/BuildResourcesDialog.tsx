import { ModalDialog } from "@/shared/ui";

type BuildResourcesDialogProps = {
  onClose: () => void;
};

const buildResources = [
  {
    description: "Ask for help and discuss builds with the community.",
    href: "https://discord.com/channels/1372170926598131874/1448753871865253971",
    name: "Official CO Discord Build Section",
  },
  {
    description: "A collection of build guides gathered on the official CO Discord.",
    href: "https://discord.com/channels/1372170926598131874/1387511849800568952",
    name: "RavenForce's Gathered Build Guides",
  },
  {
    description:
      "The basics still stand, but detailed builds are most likely outdated.",
    href: "https://steamcommunity.com/sharedfiles/filedetails/?id=3507357719",
    name: "Kamokami's End Game DPS Guide (Archived by Qawsada)",
  },
  {
    description: "A collection of ready-to-use builds.",
    href: "https://docs.google.com/spreadsheets/d/10HtRf6Sw3Wsm6vFhlViWwwYOI-mma4gd81hR_nxEjEI/edit?gid=0#gid=0",
    name: "Lancelot's Builds",
  },
  {
    description: "A collection of Champions Online builds published on Steam.",
    href: "https://steamcommunity.com/sharedfiles/filedetails/?id=3544320314",
    name: "Shapey's Steam Builds",
  },
];

export function BuildResourcesDialog({ onClose }: BuildResourcesDialogProps) {
  return (
    <ModalDialog
      ariaLabel="Build Resources"
      className="build-resources-dialog"
      description="Find help and explore community builds and guides."
      title="Build Resources"
      onClose={onClose}
    >
      <div className="build-resources-dialog__content">
        <ul className="build-resources-dialog__list">
          {buildResources.map((resource) => (
            <li key={resource.href}>
              <a
                className="tab-button build-resource-link"
                href={resource.href}
                rel="noreferrer"
                target="_blank"
              >
                <strong>{resource.name}</strong>
                <small>{resource.description}</small>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </ModalDialog>
  );
}
