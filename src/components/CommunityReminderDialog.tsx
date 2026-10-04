import { ModalDialog } from "@/shared/ui";

type CommunityReminderDialogProps = {
  onClose: () => void;
};

const feedbackThreadUrl =
  "https://discord.com/channels/1372170926598131874/1506734717456613448/1506734906213138553";

export function CommunityReminderDialog({
  onClose,
}: CommunityReminderDialogProps) {
  return (
    <ModalDialog
      ariaLabel="What's New?"
      className="community-reminder-dialog"
      closeOnBackdrop={false}
      title="What's New?"
      onClose={onClose}
    >
      <div className="community-reminder-dialog__content">
        <section>
          <h4>NEW FEATURE</h4>
          <p>
            <strong>
              Looking for build advice or want to improve your build-making
              skills?
            </strong>
          </p>
          <p>
            Explore community guides, ready-to-use builds, and other helpful
            resources created by experienced players using the highlighted{` `}
            <strong>Build Resources</strong> button.
          </p>
        </section>
        <section>
          <h4>FEEDBACK</h4>
          <p>Found a bug? Have feedback or an idea for improvement?</p>
          <p>
            Share it on the{` `}
            <a href={feedbackThreadUrl} rel="noreferrer" target="_blank">
              RetCon thread on the Official CO Discord
            </a>
            .
          </p>
        </section>
      </div>
    </ModalDialog>
  );
}
