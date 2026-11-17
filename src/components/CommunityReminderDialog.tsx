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
          <h4>VERTICAL LAYOUT BETA</h4>
          <p>
            <strong>
              A new vertical layout is now available for portrait-oriented
              screens.
            </strong>
          </p>
          <p>
            This layout is still in beta and needs real-world testing. It will
            continue to evolve based on your feedback.
          </p>
        </section>
        <section>
          <h4>FEEDBACK</h4>
          <p>
            Found a bug, an awkward interaction, or something that could work
            better in the vertical layout?
          </p>
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
