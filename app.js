// API base URL
const API_URL = "https://www.wiretree-digital.com/api";

// DOM elements
const webinarForm = document.getElementById('webinarForm');
const webinarList = document.getElementById('webinarList');
const summaryStats = document.getElementById('summaryStats');
const monthFilter = document.getElementById('monthFilter');
const generateReport = document.getElementById('generateReport');
const reportModal = document.getElementById('reportModal');
const closeModal = document.getElementById('closeModal');
const reportContent = document.getElementById('reportContent');
const reportMonth = document.getElementById('reportMonth');
const printReport = document.getElementById('printReport');
const exportReport = document.getElementById('exportReport');

// Webinars data array
let webinars = [];

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  await loadWebinars();
  populateMonthFilter();
  updateSummaryStats();
}

// =========================
// LOAD WEBINARS FROM MYSQL
// =========================
async function loadWebinars() {
  try {
    const response = await fetch(`${API_URL}/get-webinars.php`);
    if (!response.ok) throw new Error('Failed to fetch webinars');
    
    const data = await response.json();
    webinars = data;
    renderWebinarList();
    updateSummaryStats();
  } catch (error) {
    console.error('Error loading webinars:', error);
    showSnackbar('Error loading webinars. Please try again.');
  }
}

// =========================
// RENDER WEBINAR LIST
// =========================
function renderWebinarList(month = '') {
  webinarList.innerHTML = '';

  const filtered = month
    ? webinars.filter((w) => {
        const dd = new Date(w.date_time);
        if (isNaN(dd)) return false;
        const monthYear = dd.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        });
        return monthYear === month;
      })
    : webinars;

  if (filtered.length === 0) {
    webinarList.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-remax-dark-gray">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="mt-2">No webinars found</p>
        </td>
      </tr>`;
    return;
  }

  filtered.forEach((w) => {
    const date = new Date(w.date_time);
    if (isNaN(date)) {
      console.error('Invalid date:', w.date_time);
      return;
    }

    const formattedDate = date.toLocaleDateString('en-CA', { timeZone: 'UTC' }).replace(/-/g, '/');
    const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });

    const attendanceRate = w.registrants
      ? Math.round((w.attendees / w.registrants) * 100)
      : 0;

    const row = document.createElement('tr');
    row.className = 'hover:bg-remax-light-gray transition';
    row.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-remax-hub-blue">${w.name}</td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-remax-dark-gray">
        ${formattedDate}
        <span class="text-xs text-gray-500">${formattedTime}</span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-remax-dark-gray">${w.duration} min</td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-remax-dark-gray">${w.registrants}</td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-remax-dark-gray">
        ${w.attendees}
        <span class="text-xs ${attendanceRate >= 50 ? 'text-green-600' : 'text-remax-red'}">(${attendanceRate}%)</span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-sm text-remax-dark-gray">${w.host}</td>
      <td class="px-4 py-3 whitespace-nowrap text-sm">
        <button onclick="openEditModal(${w.id})" class="text-blue-600 hover:text-blue-800 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onclick="deleteWebinar(${w.id})" class="text-red-600 hover:text-red-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>`;
    webinarList.appendChild(row);
  });
}

// =========================
// POPULATE MONTH FILTER
// =========================
function populateMonthFilter() {
  const months = [
    ...new Set(
      webinars.map((w) =>
        new Date(w.date_time).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })
      )
    ),
  ].sort((a, b) => new Date(b) - new Date(a));

  monthFilter.innerHTML = '<option value="">All Months</option>';
  months.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    monthFilter.appendChild(opt);
  });
}

// =========================
// UPDATE SUMMARY STATS
// =========================
function updateSummaryStats(month = '') {
  const filtered = month
    ? webinars.filter(
        (w) =>
          new Date(w.date_time).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }) === month
      )
    : webinars;

  const totalWebinars = filtered.length;
  const totalDuration = filtered.reduce((sum, w) => sum + w.duration, 0);
  const totalAttendees = filtered.reduce((sum, w) => sum + w.attendees, 0);
  const totalRegistrants = filtered.reduce((sum, w) => sum + w.registrants, 0);
  const attendanceRate = totalRegistrants
    ? Math.round((totalAttendees / totalRegistrants) * 100)
    : 0;

  summaryStats.innerHTML = `
    <div class="bg-gradient-to-br from-remax-collection-blue to-remax-hub-blue p-4 sm:p-5 rounded-xl shadow-lg text-white">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs sm:text-sm font-medium opacity-80">Total Webinars</p>
          <p class="text-2xl sm:text-3xl font-bold mt-1">${totalWebinars}</p>
        </div>
        <div class="bg-white/10 p-1 sm:p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </div>
      <p class="text-xs mt-2 sm:mt-3 opacity-80 flex items-center">
        <span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
        ${totalWebinars > 0 ? 'Active' : 'No'} training sessions
      </p>
    </div>

    <div class="bg-gradient-to-br from-blue-600 to-blue-800 p-4 sm:p-5 rounded-xl shadow-lg text-white">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs sm:text-sm font-medium opacity-80">Total Duration</p>
          <p class="text-2xl sm:text-3xl font-bold mt-1">${totalDuration}</p>
          <p class="text-xs opacity-80">minutes</p>
        </div>
        <div class="bg-white/10 p-1 sm:p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <p class="text-xs mt-2 sm:mt-3 opacity-80">
        Avg. ${totalWebinars > 0 ? Math.round(totalDuration / totalWebinars) : 0} min/session
      </p>
    </div>

    <div class="bg-gradient-to-br from-remax-blue to-blue-600 p-4 sm:p-5 rounded-xl shadow-lg text-white">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs sm:text-sm font-medium opacity-80">Total Attendees</p>
          <p class="text-2xl sm:text-3xl font-bold mt-1">${totalAttendees}</p>
        </div>
        <div class="bg-white/10 p-1 sm:p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
      <p class="text-xs mt-2 sm:mt-3 opacity-80">
        ${totalWebinars > 0 ? Math.round(totalAttendees / totalWebinars) : 0} avg. per session
      </p>
    </div>

    <div class="bg-gradient-to-br ${attendanceRate >= 50 ? 'from-green-600 to-green-800' : 'from-remax-red to-red-800'} p-4 sm:p-5 rounded-xl shadow-lg text-white">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs sm:text-sm font-medium opacity-80">Attendance Rate</p>
          <p class="text-2xl sm:text-3xl font-bold mt-1">${attendanceRate}%</p>
        </div>
        <div class="bg-white/10 p-1 sm:p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      <p class="text-xs mt-2 sm:mt-3 opacity-80 flex items-center">
        <span class="inline-block w-2 h-2 ${attendanceRate >= 50 ? 'bg-green-300' : 'bg-red-300'} rounded-full mr-1"></span>
        ${attendanceRate >= 50 ? 'Above' : 'Below'} target threshold
      </p>
    </div>
  `;
}

// =========================
// CREATE WEBINAR
// =========================
webinarForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = webinarForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Saving...
  `;

  const webinar = {
    name: webinarForm.webinarName.value,
    date_time: webinarForm.webinarDateTime.value,
    duration: parseInt(webinarForm.webinarDuration.value),
    registrants: parseInt(webinarForm.webinarRegistrants.value),
    host: webinarForm.hostName.value,
    attendees: parseInt(webinarForm.webinarAttendees.value),
  };

  try {
    const response = await fetch(`${API_URL}/create-webinar.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webinar)
    });

    if (!response.ok) throw new Error('Failed to create webinar');

    const data = await response.json();
    webinars.unshift(data);
    
    webinarForm.reset();
    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();
    
    showSnackbar('Webinar saved successfully!');
  } catch (error) {
    console.error('Error saving webinar:', error);
    showSnackbar('Error saving webinar. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// =========================
// DELETE WEBINAR
// =========================
window.deleteWebinar = async (id) => {
  if (!confirm('Are you sure you want to delete this webinar?')) return;

  try {
    const response = await fetch(`${API_URL}/delete-webinar.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id })
    });

    if (!response.ok) throw new Error('Failed to delete webinar');

    webinars = webinars.filter((w) => w.id !== id);
    renderWebinarList(monthFilter.value);
    updateSummaryStats(monthFilter.value);
    populateMonthFilter();
    
    showSnackbar('Webinar deleted successfully!');
  } catch (error) {
    console.error('Error deleting webinar:', error);
    showSnackbar('Error deleting webinar. Please try again.');
  }
};

// =========================
// OPEN EDIT MODAL
// =========================
window.openEditModal = (id) => {
  const webinar = webinars.find(w => w.id === id);
  if (!webinar) return;

  // Create edit modal HTML
  const modalHTML = `
    <div id="editModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">Edit Webinar</h3>
        <form id="editForm">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Webinar Name</label>
            <input type="text" id="editName" value="${webinar.name}" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Date & Time</label>
            <input type="datetime-local" id="editDateTime" value="${webinar.date_time.slice(0, 16)}" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input type="number" id="editDuration" value="${webinar.duration}" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Registrants</label>
            <input type="number" id="editRegistrants" value="${webinar.registrants}" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Attendees</label>
            <input type="number" id="editAttendees" value="${webinar.attendees}" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Host</label>
            <input type="text" id="editHost" value="${webinar.host}" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" onclick="closeEditModal()" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updatedData = {
      name: document.getElementById('editName').value,
      date_time: document.getElementById('editDateTime').value,
      duration: parseInt(document.getElementById('editDuration').value),
      registrants: parseInt(document.getElementById('editRegistrants').value),
      attendees: parseInt(document.getElementById('editAttendees').value),
      host: document.getElementById('editHost').value,
    };

    await editWebinar(id, updatedData);
    closeEditModal();
  });
};

// =========================
// CLOSE EDIT MODAL
// =========================
window.closeEditModal = () => {
  const modal = document.getElementById('editModal');
  if (modal) modal.remove();
};

// =========================
// UPDATE WEBINAR
// =========================
async function editWebinar(id, updatedData) {
  try {
    const response = await fetch(`${API_URL}/update-webinar.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updatedData })
    });

    if (!response.ok) throw new Error('Failed to update webinar');

    webinars = webinars.map((w) =>
      w.id === id ? { ...w, ...updatedData } : w
    );

    renderWebinarList(monthFilter.value);
    updateSummaryStats(monthFilter.value);
    populateMonthFilter();

    showSnackbar('Webinar updated successfully!');
  } catch (error) {
    console.error('Error updating webinar:', error);
    showSnackbar('Error updating webinar. Please try again.');
  }
}

// =========================
// MONTH FILTER CHANGE
// =========================
monthFilter.addEventListener('change', () => {
  const month = monthFilter.value;
  renderWebinarList(month);
  updateSummaryStats(month);
});

// =========================
// GENERATE REPORT
// =========================
generateReport.addEventListener('click', () => {
  const month = monthFilter.value;
  if (!month) {
    showSnackbar('Please select a month');
    return;
  }

  const filtered = webinars.filter(
    (w) =>
      new Date(w.date_time).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      }) === month
  );

  if (!filtered.length) {
    showSnackbar('No data for this month');
    return;
  }

  let html = `
    <div class="mb-6">
      <h3 class="text-xl font-bold text-remax-blue mb-2">${month} Webinar Report</h3>
      <div class="bg-remax-light-gray p-4 rounded-lg">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-remax-dark-gray">Total Webinars</p>
            <p class="text-lg font-bold">${filtered.length}</p>
          </div>
          <div>
            <p class="text-sm text-remax-dark-gray">Total Duration</p>
            <p class="text-lg font-bold">${filtered.reduce((sum, w) => sum + w.duration, 0)} min</p>
          </div>
          <div>
            <p class="text-sm text-remax-dark-gray">Total Attendees</p>
            <p class="text-lg font-bold">${filtered.reduce((sum, w) => sum + w.attendees, 0)}</p>
          </div>
          <div>
            <p class="text-sm text-remax-dark-gray">Attendance Rate</p>
            <p class="text-lg font-bold">
              ${
                filtered.reduce((sum, w) => sum + w.registrants, 0)
                  ? Math.round(
                      (filtered.reduce((sum, w) => sum + w.attendees, 0) /
                        filtered.reduce((sum, w) => sum + w.registrants, 0)) *
                        100
                    )
                  : 0
              }%
            </p>
          </div>
        </div>
      </div>
    </div>
    <h4 class="font-semibold text-remax-hub-blue mb-3 pb-2 border-b border-gray-200">Webinar Details</h4>
    <div class="space-y-4">
  `;

  filtered.forEach((w) => {
    const date = new Date(w.date_time);
    const attendanceRate = w.registrants
      ? Math.round((w.attendees / w.registrants) * 100)
      : 0;

    html += `
      <div class="bg-remax-light-gray p-4 rounded-lg">
        <div class="flex justify-between items-start">
          <div>
            <h5 class="font-medium text-remax-blue">${w.name}</h5>
            <p class="text-sm text-remax-dark-gray">
              ${date.toLocaleDateString()} •
              ${date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} •
              ${w.duration} min
            </p>
          </div>
          <span class="text-sm font-medium ${
            attendanceRate >= 50 ? 'text-green-600' : 'text-remax-red'
          }">
            ${attendanceRate}% attendance
          </span>
        </div>
        <div class="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-remax-dark-gray">Host</p>
            <p>${w.host}</p>
          </div>
          <div>
            <p class="text-remax-dark-gray">Registrants</p>
            <p>${w.registrants}</p>
          </div>
          <div>
            <p class="text-remax-dark-gray">Attendees</p>
            <p>${w.attendees}</p>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  reportMonth.textContent = month;
  reportContent.innerHTML = html;
  reportModal.classList.remove('hidden');
});

// =========================
// CLOSE MODAL
// =========================
closeModal.addEventListener('click', () => {
  reportModal.classList.add('hidden');
});

// =========================
// PRINT REPORT
// =========================
printReport.addEventListener('click', () => {
  const printContent = reportContent.innerHTML;
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = `
    <div class="p-6">
      <div class="flex items-center mb-4">
        <img src="https://hub.remax.co.za/images/REMAX_Southern_Africa.png" alt="RE/MAX Logo" class="h-10 mr-4">
        <h1 class="text-xl font-bold text-remax-blue">Webinar Report</h1>
      </div>
      ${printContent}
    </div>
  `;

  window.print();
  document.body.innerHTML = originalContent;
  location.reload();
});

// =========================
// EXPORT REPORT
// =========================
exportReport.addEventListener('click', () => {
  const rows = [
    [
      'Name',
      'Date',
      'Time',
      'Duration',
      'Host',
      'Registrants',
      'Attendees',
      'Attendance Rate',
    ],
  ];

  webinars.forEach((w) => {
    const date = new Date(w.date_time);
    const attendanceRate = w.registrants
      ? Math.round((w.attendees / w.registrants) * 100)
      : 0;

    rows.push([
      w.name,
      date.toLocaleDateString(),
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      w.duration,
      w.host,
      w.registrants,
      w.attendees,
      `${attendanceRate}%`,
    ]);
  });

  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'remax_webinars_report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// =========================
// SHOW SNACKBAR
// =========================
function showSnackbar(message) {
  const snackbar = document.createElement('div');
  snackbar.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50';
  snackbar.textContent = message;
  document.body.appendChild(snackbar);
  
  setTimeout(() => {
    snackbar.remove();
  }, 3000);
}
