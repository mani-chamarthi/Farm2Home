(() => {
  "use strict";

  const modal = document.getElementById("abstractModal");
  const abstractButton = document.getElementById("abstractButton");
  const closeButton = document.getElementById("closeModal");

  if (!modal || !abstractButton || !closeButton) {
    throw new Error("The project showcase abstract dialog is not available.");
  }

  abstractButton.addEventListener("click", () => modal.showModal());
  closeButton.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.open) modal.close();
  });
})();
