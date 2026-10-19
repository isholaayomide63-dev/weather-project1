const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const list = document.getElementById("todoList");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  // create li
  const li = document.createElement("li");
  li.className = "todo-item";

  // task text
  const span = document.createElement("span");
  span.className = "todo-text";
  span.textContent = text;

  // actions container
  const actions = document.createElement("div");
  actions.className = "todo-actions";

  // ✅ done button
  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.className = "icon-btn";
  doneBtn.title = "Done";
  doneBtn.textContent = "✓";

  doneBtn.addEventListener("click", () => {
    li.classList.toggle("done");
  });

  // ✎ edit button
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn";
  editBtn.title = "Edit";
  editBtn.textContent = "✎";

  editBtn.addEventListener("click", () => {
    const newText = prompt("Edit task:", span.textContent);
    if (newText === null) return; // user cancelled
    const cleaned = newText.trim();
    if (cleaned) span.textContent = cleaned;
  });

  // 🗑 delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "icon-btn danger";
  deleteBtn.title = "Delete";
  deleteBtn.textContent = "🗑";

  deleteBtn.addEventListener("click", () => {
    li.remove();
  });

  // assemble
  actions.appendChild(doneBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(span);
  li.appendChild(actions);

  list.appendChild(li);
  input.value = "";
});