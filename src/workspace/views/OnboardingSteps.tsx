import Button from "antd/es/button";
export default function OnboardingSteps() {
  return (
    <>
      <div className="dialog-head">
        <div>
          <span className="onboarding-brand">HWorkTime</span>
          <h2 id="onboardingTitle" tabIndex={-1}></h2>
        </div>
      </div>
      <div className="dialog-body">
        <ol className="onboarding-timeline">
          <li className="onboarding-item" data-stage="folder">
            <span className="onboarding-node" aria-hidden="true">
              <span className="onboarding-node-text">01</span>
              <svg
                className="ui-icon onboarding-node-check"
                aria-hidden="true"
                {...{ hidden: true }}
              >
                <use href="#icon-check" />
              </svg>
            </span>
            <div className="onboarding-stage">
              <h3
                className="onboarding-stage-heading"
                data-onboarding-heading="folder"
              >
                <span data-stage-title=""></span>
                <span className="onboarding-stage-status"></span>
              </h3>
              <section id="onboardingFolder" data-onboarding-step="folder">
                <h3 data-onboarding-title=""></h3>
                <p data-onboarding-text=""></p>
                <Button
                  className="hw-button ui-button primary onboarding-folder-button"
                  htmlType="button"
                ></Button>
                <p className="help" data-onboarding-support=""></p>
                <p
                  className="warnings"
                  data-onboarding-error=""
                  role="alert"
                ></p>
              </section>
            </div>
          </li>
          <li className="onboarding-item" data-stage="install">
            <span className="onboarding-node" aria-hidden="true">
              <span className="onboarding-node-text">02</span>
              <svg
                className="ui-icon onboarding-node-check"
                aria-hidden="true"
                {...{ hidden: true }}
              >
                <use href="#icon-check" />
              </svg>
            </span>
            <div className="onboarding-stage">
              <h3
                className="onboarding-stage-heading"
                data-onboarding-heading="install"
              >
                <span data-stage-title=""></span>
                <span className="onboarding-stage-status"></span>
              </h3>
              <section id="onboardingInstall" data-onboarding-step="install">
                <div className="onboarding-install-head">
                  <h3 data-onboarding-title=""></h3>
                  <label className="onboarding-install-dismiss">
                    <input
                      data-ui="input"
                      type="checkbox"
                      data-onboarding-dismiss-install=""
                      className="hw-check"
                    />
                    <span></span>
                  </label>
                </div>
                <p data-onboarding-text=""></p>
                <Button
                  data-ui="button"
                  htmlType="button"
                  data-onboarding-install=""
                  className="hw-button ui-button onboarding-install-button"
                ></Button>
                <p className="help" data-onboarding-manual="" role="status"></p>
              </section>
            </div>
          </li>
        </ol>
      </div>
      <div className="dialog-foot" data-ui="toolbar">
        <p
          className="onboarding-folder-required"
          id="onboardingFolderRequired"
          role="status"
        ></p>
        <div className="onboarding-actions" data-ui="toolbar">
          <Button
            data-ui="button"
            htmlType="button"
            data-onboarding-next=""
            className="hw-button ui-button primary"
          ></Button>
        </div>
      </div>
    </>
  );
}
