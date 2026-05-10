
/**
 * Utility for exporting data to CSV
 */

export const exportToCSV = (data, filename, columns) => {
    if (!data || !data.length) {
        return;
    }

    // 1. Create headers
    const headers = columns.map(col => col.label).join(',');

    // 2. Create rows
    const rows = data.map(item => {
        return columns.map(col => {
            let val = '';
            if (typeof col.field === 'function') {
                val = col.field(item);
            } else {
                val = item[col.field];
            }
            
            // Handle commas and quotes in values
            if (val === null || val === undefined) val = '';
            val = String(val).replace(/"/g, '""');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = `"${val}"`;
            }
            return val;
        }).join(',');
    });

    // 3. Combine
    const csvContent = [headers, ...rows].join('\n');

    // 4. Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
