import { supabase } from './supabase.js';

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

  document.getElementById('webinarDateTime').value = webinar.date_time.slice(
    0,
    16
  );
}

// Load webinars from Supabase
async function loadWebinars() {
  try {
    const { data, error } = await supabase
      .from('webinars')
      .select('*')
      .order('date_time', { ascending: false });

    if (error) throw error;

    webinars = data;
    renderWebinarList();
  } catch (error) {
    console.error('Error loading webinars:', error);
    alert('Error loading webinars. Please check console for details.');
  }
}

// Form submission handler
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
    const { data, error } = await supabase
      .from('webinars')
      .insert([webinar])
      .select();

    if (error) throw error;

    webinars.unshift(data[0]);
    webinarForm.reset();
    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();

    alert('Webinar saved successfully!');
  } catch (error) {
    console.error('Error saving webinar:', error);
    alert('Error saving webinar. Please check console for details.');
  }
});

// Delete webinar handler
window.deleteWebinar = async function (id) {
  if (!confirm('Are you sure you want to delete this webinar?')) return;

  try {
    const { error } = await supabase.from('webinars').delete().eq('id', id);

    if (error) throw error;

    webinars = webinars.filter((w) => w.id !== id);
    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();

    alert('Webinar deleted successfully!');
  } catch (error) {
    console.error('Error deleting webinar:', error);
    alert('Error deleting webinar. Please check console for details.');
  }
};

// Edit webinar handler
window.editWebinar = async function (id, updatedData) {
  try {
    const { error } = await supabase
      .from('webinars')
      .update(updatedData)
      .eq('id', id);

    if (error) throw error;

    // Update the local webinars array
    webinars = webinars.map((w) =>
      w.id === id ? { ...w, ...updatedData } : w
    );

    renderWebinarList();
    updateSummaryStats();
    populateMonthFilter();

    alert('Webinar updated successfully!');
  } catch (error) {
    console.error('Error updating webinar:', error);
    alert('Error updating webinar. Please check console for details.');
  }
};

// Render webinar list
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
        <td colspan="6" class="px-4 py-2 text-center text-remax-dark-gray">
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
      <td class="px-4 py-2">${date.toLocaleDateString()} ${date.toLocaleTimeString(
      [],
      { hour: '2-digit', minute: '2-digit' }
    )}</td>
      <td class="px-4 py-2">${webinar.duration} min</td>
      <td class="px-4 py-2">${webinar.registrants}</td>
      <td class="px-4 py-2">${webinar.attendees}</td>
      <td class="px-4 py-2">${webinar.host}</td>
      <td class="px-4 py-2">
        <button onclick="editWebinar('${
          webinar.id
        }')" class="text-green-500 hover:text-green-700">
          Edit
        </button>
      </td>
      <td class="px-4 py-2">
        <button onclick="deleteWebinar('${
          webinar.id
        }')" class="text-red-500 hover:text-red-700">
          Delete
        </button>
      </td>
    `;

    webinarList.appendChild(row);
  });
}

// Populate month filter dropdown
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
  ].sort((a, b) => new Date(a) - new Date(b));

  months.forEach((month) => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthFilter.appendChild(option);
  });
}

// Update summary statistics
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
  const totalDuration = filteredWebinars.reduce(
    (sum, w) => sum + w.duration,
    0
  );
  const totalRegistrants = filteredWebinars.reduce(
    (sum, w) => sum + w.registrants,
    0
  );
  const totalAttendees = filteredWebinars.reduce(
    (sum, w) => sum + w.attendees,
    0
  );
  const attendanceRate =
    totalRegistrants > 0
      ? Math.round((totalAttendees / totalRegistrants) * 100)
      : 0;

  summaryStats.innerHTML = `
    <div class="bg-white p-3 rounded-md shadow">
      <h4 class="font-medium text-remax-dark-gray">Total Webinars</h4>
      <p class="text-2xl font-bold text-remax-blue">${totalWebinars}</p>
    </div>
    <div class="bg-white p-3 rounded-md shadow">
      <h4 class="font-medium text-remax-dark-gray">Total Duration</h4>
      <p class="text-2xl font-bold text-remax-blue">${totalDuration} min</p>
    </div>
    <div class="bg-white p-3 rounded-md shadow">
      <h4 class="font-medium text-remax-dark-gray">Total Attendees</h4>
      <p class="text-2xl font-bold text-remax-blue">${totalAttendees}</p>
    </div>
    <div class="bg-white p-3 rounded-md shadow">
      <h4 class="font-medium text-remax-dark-gray">Attendance Rate</h4>
      <p class="text-2xl font-bold text-remax-blue">${attendanceRate}%</p>
    </div>
  `;
}

// Generate monthly report
generateReport.addEventListener('click', function () {
  const selectedMonth = monthFilter.value;
  if (!selectedMonth) {
    alert('Please select a month first');
    return;
  }

  const filteredWebinars = webinars.filter((w) => {
    const date = new Date(w.date_time);
    return (
      date.toLocaleString('default', { month: 'long', year: 'numeric' }) ===
      selectedMonth
    );
  });

  if (filteredWebinars.length === 0) {
    alert('No webinars found for the selected month');
    return;
  }

  const totalDuration = filteredWebinars.reduce(
    (sum, w) => sum + w.duration,
    0
  );
  const totalRegistrants = filteredWebinars.reduce(
    (sum, w) => sum + w.registrants,
    0
  );
  const totalAttendees = filteredWebinars.reduce(
    (sum, w) => sum + w.attendees,
    0
  );
  const attendanceRate =
    totalRegistrants > 0
      ? Math.round((totalAttendees / totalRegistrants) * 100)
      : 0;

  let webinarItems = '';
  filteredWebinars.forEach((webinar) => {
    const date = new Date(webinar.date_time);
    webinarItems += `
      <div class="mb-4 pb-4 border-b border-gray-200">
        <h3 class="font-semibold text-remax-blue">${webinar.name}</h3>
        <p class="text-sm text-remax-dark-gray">
          ${date.toLocaleDateString()} • ${webinar.duration} minutes
        </p>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <div>
            <span class="text-remax-dark-gray">Registrants:</span>
            <span class="font-medium">${webinar.registrants}</span>
          </div>
          <div>
            <span class="text-remax-dark-gray">Attendees:</span>
            <span class="font-medium">${webinar.attendees}</span>
          </div>
        </div>
      </div>
    `;
  });

  reportContent.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-remax-blue mb-2">
        ${selectedMonth} Webinar Report
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-remax-light-gray p-3 rounded-md">
          <h4 class="font-medium text-remax-dark-gray">Total Webinars</h4>
          <p class="text-xl font-bold text-remax-blue">${
            filteredWebinars.length
          }</p>
        </div>
        <div class="bg-remax-light-gray p-3 rounded-md">
          <h4 class="font-medium text-remax-dark-gray">Total Duration</h4>
          <p class="text-xl font-bold text-remax-blue">${totalDuration} min</p>
        </div>
        <div class="bg-remax-light-gray p-3 rounded-md">
          <h4 class="font-medium text-remax-dark-gray">Total Attendees</h4>
          <p class="text-xl font-bold text-remax-blue">${totalAttendees}</p>
        </div>
        <div class="bg-remax-light-gray p-3 rounded-md">
          <h4 class="font-medium text-remax-dark-gray">Attendance Rate</h4>
          <p class="text-xl font-bold text-remax-blue">${attendanceRate}%</p>
        </div>
      </div>
    </div>
    
    <h3 class="text-xl font-semibold text-remax-dark-blue mb-3">Webinar Details</h3>
    ${webinarItems}
    
    <div class="mt-6 p-4 bg-remax-light-gray rounded-md">
      <h3 class="font-semibold text-remax-dark-blue mb-2">Key Takeaways</h3>
      <p class="mb-2">• Conducted ${
        filteredWebinars.length
      } webinars with ${totalAttendees} total attendees</p>
      <p class="mb-2">• Average attendance rate of ${attendanceRate}%</p>
      <p class="mb-2">• Total training time: ${totalDuration} minutes (${Math.round(
    totalDuration / 60
  )} hours)</p>
      <p>• Average webinar duration: ${Math.round(
        totalDuration / filteredWebinars.length
      )} minutes</p>
    </div>
  `;

  reportModal.classList.remove('hidden');
});

// Close modal
closeModal.addEventListener('click', function () {
  reportModal.classList.add('hidden');
});

// Print report
printReport.addEventListener('click', function () {
  window.print();
});

// Export to CSV
exportReport.addEventListener('click', function () {
  const selectedMonth = monthFilter.value;
  const filteredWebinars = webinars.filter((w) => {
    const date = new Date(w.date_time);
    return (
      date.toLocaleString('default', { month: 'long', year: 'numeric' }) ===
      selectedMonth
    );
  });

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent +=
    'Webinar Name,Date,Time,Duration (min),Registrants,Attendees,Attendance Rate\n';

  filteredWebinars.forEach((webinar) => {
    const date = new Date(webinar.date_time);
    const attendanceRate =
      webinar.registrants > 0
        ? Math.round((webinar.attendees / webinar.registrants) * 100)
        : 0;

    csvContent += `"${
      webinar.name
    }",${date.toLocaleDateString()},${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })},${webinar.duration},${webinar.registrants},${
      webinar.attendees
    },${attendanceRate}%\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `webinar_report_${selectedMonth.replace(' ', '_')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Month filter change
monthFilter.addEventListener('change', function () {
  const selectedMonth = this.value;
  renderWebinarList(selectedMonth);
  updateSummaryStats(selectedMonth);
});

// Initialize the app
init();
