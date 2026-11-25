function observeSettings() {
  const host = document.getElementById("weather-settings");
  if (!host) return;
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      void import("./weather/mount").then(({ mount }) => mount(host));
    }
  });
  observer.observe(host);
}
if (document.getElementById("weather-settings")) observeSettings();
else
  document.addEventListener("worktime:weather-settings", observeSettings, {
    once: true,
  });
