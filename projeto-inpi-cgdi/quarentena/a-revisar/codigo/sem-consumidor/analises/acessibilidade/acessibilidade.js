(() => {
  const table = document.querySelector('#areas-table');
  if (!table) return;

  const body = table.tBodies[0];
  let direction = 1;
  let activeColumn = -1;

  table.querySelectorAll('th button[data-column]').forEach((button) => {
    button.addEventListener('click', () => {
      const column = Number(button.dataset.column);
      direction = activeColumn === column ? direction * -1 : 1;
      activeColumn = column;
      const rows = [...body.rows];
      rows.sort((a, b) => {
        if (column === 1) return (Number(a.dataset.order) - Number(b.dataset.order)) * direction;
        return a.cells[column].textContent.localeCompare(b.cells[column].textContent, 'pt-BR') * direction;
      });
      rows.forEach((row) => body.append(row));
      table.querySelectorAll('th[aria-sort]').forEach((item) => item.removeAttribute('aria-sort'));
      button.closest('th').setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
    });
  });
})();
