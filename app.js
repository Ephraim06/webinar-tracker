// API base URL
const API_URL = "https://wiretree-digital.com/api";

// DOM elements
const webinarForm = document.getElementById('webinarForm');
const webinarList = document.getElementById('webinarList');
const monthFilter = document.getElementById('monthFilter');
const generateReport = document.getElementById('generateReport');
const summaryStats = document.getElementById('summaryStats');
const reportModal = document.getElementById('reportModal');
const closeModal = document.getElementById('closeModal');
const reportContent = document.getElementById('reportContent');
const printReport = document.getElementById('printReport');
const exportReport = document.getElementById('exportReport');

// Webinar data array
let webinars = [];

// Initialize the app
async function init() {
  await loadWebinars();
  populateMonthFilter();
  updateSummaryStats();
}

// =========================
// LOAD WEBINARS (GET)
// =========================
async function loadWebinars() {
  try {
    const res = await fetch(`${API_URL}/get-webinars.php`);
    const data = await res.json();

    webinars = data;
    renderWebinarList();
  } catch (error) {
    console.error('Error loading webinars:', error);
  }
}

// =========================
// CREATE WEBINAR (POST)
// =========================
webinarForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const webinar = {
    name: document.getElementById('webinarName').value,
    date_time: document.getElementById('webinarDateTime').value,
    duration: parseInt(document.getElementById('webinarDuration').value),
    registrants: parseInt(document.getElementById('webinarRegistrants').value),
    attendees: parseInt(document.getElementById('webinarAttendees').value),
    host: document.getElementById('hostName').value,
  };

  try {
    const res = await fetch(`${API_URL}/create-webinar.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webinar)
    });

    const data = await res.json();

    webinars.unshift(data);
    webinarForm.reset();
    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();

    alert('Webinar saved successfully!');
  } catch (error) {
    console.error('Error saving webinar:', error);
  }
});

// =========================
// DELETE WEBINAR
// =========================
window.deleteWebinar = async function (id) {
  if (!confirm('Are you sure you want to delete this webinar?')) return;

  try {
    await fetch(`${API_URL}/delete-webinar.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    webinars = webinars.filter((w) => w.id !== id);
    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();

    alert('Webinar deleted successfully!');
  } catch (error) {
    console.error('Error deleting webinar:', error);
  }
};

// =========================
// UPDATE WEBINAR
// =========================
window.editWebinar = async function (id, updatedData) {
  try {
    await fetch(`${API_URL}/update-webinar.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, ...updatedData })
    });

    webinars = webinars.map((w) =>
      w.id === id ? { ...w, ...updatedData } : w
    );

    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();

    alert('Webinar updated successfully!');
  } catch (error) {
    console.error('Error updating webinar:', error);
  }
};

// =========================
// RENDER TABLE
// =========================
function renderWebinarList(filterMonth = '') {
  webinarList.innerHTML = '';

  const filteredWebinars = filterMonth
    ? webinars.filter((w) => {
        const date = new Date(w.date_time);
        return (
          date.toLocaleString('default', { month: 'long', year: 'numeric' }) ===
          filterMonth
        );
      })
    : webinars;

  if (filteredWebinars.length === 0) {
    webinarList.innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-2 text-center">
          No webinars found
        </td>
      </tr>
    `;
    return;
  }

  filteredWebinars.forEach((webinar) => {
    const row = document.createElement('tr');
    const date = new Date(webinar.date_time);

    row.innerHTML = `
      <td class="px-4 py-2">${webinar.name}</td>
      <td class="px-4 py-2">${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td class="px-4 py-2">${webinar.duration} min</td>
      <td class="px-4 py-2">${webinar.registrants}</td>
      <td class="px-4 py-2">${webinar.attendees}</td>
      <td class="px-4 py-2">${webinar.host}</td>
      <td class="px-4 py-2">
        <button onclick="editWebinar('${webinar.id}')" class="text-green-500">Edit</button>
      </td>
      <td class="px-4 py-2">
        <button onclick="deleteWebinar('${webinar.id}')" class="text-red-500">Delete</button>
      </td>
    `;

    webinarList.appendChild(row);
  });
}

// =========================
// FILTER + STATS
// =========================
function populateMonthFilter() {
  monthFilter.innerHTML = '<option value="">All Months</option>';

  const months = [
    ...new Set(
      webinars.map((w) => {
        const date = new Date(w.date_time);
        return date.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });
      })
    ),
  ];

  months.forEach((month) => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });
}

function updateSummaryStats(filterMonth = '') {
  const filteredWebinars = filterMonth
    ? webinars.filter((w) => {
        const date = new Date(w.date_time);
        return (
          date.toLocaleString('default', { month: 'long', year: 'numeric' }) ===
          filterMonth
        );
      })
    : webinars;

  const totalWebinars = filteredWebinars.length;
  const totalDuration = filteredWebinars.reduce((sum, w) => sum + w.duration, 0);
  const totalRegistrants = filteredWebinars.reduce((sum, w) => sum + w.registrants, 0);
  const totalAttendees = filteredWebinars.reduce((sum, w) => sum + w.attendees, 0);

  const attendanceRate =
    totalRegistrants > 0
      ? Math.round((totalAttendees / totalRegistrants) * 100)
      : 0;

  summaryStats.innerHTML = `
    <div>Total Webinars: ${totalWebinars}</div>
    <div>Total Duration: ${totalDuration} min</div>
    <div>Total Attendees: ${totalAttendees}</div>
    <div>Attendance Rate: ${attendanceRate}%</div>
  `;
}

// =========================
// FILTER EVENT
// =========================
monthFilter.addEventListener('change', function () {
  const selectedMonth = this.value;
  renderWebinarList(selectedMonth);
  updateSummaryStats(selectedMonth);
});

// =========================
// INIT
// =========================
init();
