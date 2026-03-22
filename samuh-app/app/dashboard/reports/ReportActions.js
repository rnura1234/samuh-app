// app/dashboard/reports/ReportActions.js
'use client'
import { useState } from 'react'

export default function ReportActions({
  members, deposits, loans, transactions,
  summary, currentMonth, currentYear
}) {
  const [loading, setLoading] = useState(null)

  const monthName = new Date(currentYear, currentMonth - 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  // ── CSV export utility ──────────────────────────────────────
  function downloadCSV(filename, headers, rows) {
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── PDF utility — fixed dynamic import ─────────────────────
  async function generatePDF(title, drawContent) {
    // ✅ Use browser-compatible build instead of node build
    const jsPDFModule   = await import('jspdf/dist/jspdf.umd.min.js')
    const autoTableModule = await import('jspdf-autotable')

    const jsPDF     = jsPDFModule.jsPDF
    const autoTable = autoTableModule.default

    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Samuh Group', 14, 18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(title, 14, 26)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 32)
    doc.setTextColor(0)

    drawContent(doc, autoTable)
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
  }

  // ── Excel utility ────────────────────────────────────────────
  async function generateExcel(filename, sheets) {
    const XLSX = await import('xlsx')
    const wb   = XLSX.utils.book_new()

    sheets.forEach(({ name, headers, rows }) => {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      XLSX.utils.book_append_sheet(wb, ws, name)
    })

    XLSX.writeFile(wb, filename)
  }

  // ── 1. Monthly group summary PDF ────────────────────────────
  async function handleMonthlySummaryPDF() {
    setLoading('monthly-pdf')
    await generatePDF(`Monthly Summary — ${monthName}`, (doc, autoTable) => {
      doc.setFontSize(10)
      doc.text(`Fund Balance:    ₹${summary.fundBalance.toLocaleString('en-IN')}`, 14, 42)
      doc.text(`Total Deposited: ₹${summary.totalDeposited.toLocaleString('en-IN')}`, 14, 49)
      doc.text(`Loans Out:       ₹${summary.totalLoansOut.toLocaleString('en-IN')}`, 14, 56)
      doc.text(`Repayments In:   ₹${summary.totalRepayments.toLocaleString('en-IN')}`, 14, 63)

      const monthDeposits = deposits.filter(
        d => d.month === currentMonth && d.year === currentYear
      )

      autoTable(doc, {
        startY: 72,
        head: [['Member', 'Amount', 'Status', 'Paid On']],
        body: monthDeposits.map(d => [
          d.members?.name || '—',
          `₹${Number(d.amount).toLocaleString('en-IN')}`,
          d.is_paid ? 'Paid' : 'Unpaid',
          d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN') : '—',
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      })
    })
    setLoading(null)
  }

  // ── 2. Member statements PDF ─────────────────────────────────
  async function handleMemberStatementPDF() {
    setLoading('member-pdf')
    await generatePDF(`Member Statements — ${currentYear}`, (doc, autoTable) => {
      members.forEach((member, idx) => {
        if (idx > 0) doc.addPage()

        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text(member.name, 14, 45)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Phone: ${member.phone}`, 14, 52)

        const memberDeposits = deposits.filter(d => d.member_id === member.id)
        const totalPaid = memberDeposits
          .filter(d => d.is_paid)
          .reduce((s, d) => s + Number(d.amount), 0)

        const memberLoans  = loans.filter(l => l.member_id === member.id)
        const totalLoaned  = memberLoans.reduce((s, l) => s + Number(l.amount), 0)

        doc.text(`Total Deposited: ₹${totalPaid.toLocaleString('en-IN')}`, 14, 59)
        doc.text(`Total Loaned:    ₹${totalLoaned.toLocaleString('en-IN')}`, 14, 66)

        autoTable(doc, {
          startY: 74,
          head: [['Month', 'Amount', 'Status', 'Paid On']],
          body: memberDeposits.map(d => [
            new Date(d.year, d.month - 1).toLocaleString('en-IN', {
              month: 'short', year: 'numeric'
            }),
            `₹${Number(d.amount).toLocaleString('en-IN')}`,
            d.is_paid ? 'Paid' : 'Unpaid',
            d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN') : '—',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
        })
      })
    })
    setLoading(null)
  }

  // ── 3. Deposits CSV ───────────────────────────────────────────
  function handleDepositsCSV() {
    setLoading('deposits-csv')
    downloadCSV(
      `deposits_${currentYear}.csv`,
      ['Member', 'Month', 'Year', 'Amount', 'Status', 'Paid On', 'Late Fee'],
      deposits.map(d => [
        d.members?.name,
        new Date(d.year, d.month - 1).toLocaleString('en-IN', { month: 'long' }),
        d.year,
        Number(d.amount),
        d.is_paid ? 'Paid' : 'Unpaid',
        d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN') : '',
        Number(d.late_fee || 0),
      ])
    )
    setLoading(null)
  }

  // ── 4. Loans CSV ──────────────────────────────────────────────
  function handleLoansCSV() {
    setLoading('loans-csv')
    downloadCSV(
      'loans.csv',
      ['Member', 'Amount', 'Interest Rate', 'Status', 'Issued On', 'Due Date', 'Reason'],
      loans.map(l => [
        l.members?.name,
        Number(l.amount),
        `${l.interest_rate}%`,
        l.status,
        l.issued_at ? new Date(l.issued_at).toLocaleDateString('en-IN') : '',
        l.due_date  ? new Date(l.due_date).toLocaleDateString('en-IN') : '',
        l.reason || '',
      ])
    )
    setLoading(null)
  }

  // ── 5. Full Excel workbook ────────────────────────────────────
  async function handleFullExcel() {
    setLoading('excel')
    await generateExcel(`samuh_report_${currentYear}.xlsx`, [
      {
        name: 'Members',
        headers: ['Name', 'Phone', 'Role', 'Status', 'Join Date'],
        rows: members.map(m => [
          m.name, m.phone, m.role, m.status,
          new Date(m.join_date).toLocaleDateString('en-IN'),
        ]),
      },
      {
        name: 'Deposits',
        headers: ['Member', 'Month', 'Year', 'Amount', 'Status', 'Paid On'],
        rows: deposits.map(d => [
          d.members?.name,
          new Date(d.year, d.month - 1).toLocaleString('en-IN', { month: 'long' }),
          d.year,
          Number(d.amount),
          d.is_paid ? 'Paid' : 'Unpaid',
          d.paid_at ? new Date(d.paid_at).toLocaleDateString('en-IN') : '',
        ]),
      },
      {
        name: 'Loans',
        headers: ['Member', 'Amount', 'Interest', 'Status', 'Issued On', 'Reason'],
        rows: loans.map(l => [
          l.members?.name,
          Number(l.amount),
          `${l.interest_rate}%`,
          l.status,
          l.issued_at ? new Date(l.issued_at).toLocaleDateString('en-IN') : '',
          l.reason || '',
        ]),
      },
      {
        name: 'Transactions',
        headers: ['Date', 'Member', 'Type', 'Direction', 'Amount', 'Note'],
        rows: transactions.map(t => [
          new Date(t.created_at).toLocaleDateString('en-IN'),
          t.members?.name || '',
          t.type,
          t.direction,
          Number(t.amount),
          t.note || '',
        ]),
      },
    ])
    setLoading(null)
  }

  // ── 6. Printable ledger PDF ───────────────────────────────────
  async function handleLedgerPDF() {
    setLoading('ledger-pdf')
    await generatePDF('Transaction Ledger', (doc, autoTable) => {
      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Member', 'Type', 'Note', 'Credit', 'Debit']],
        body: transactions.map(t => [
          new Date(t.created_at).toLocaleDateString('en-IN'),
          t.members?.name || '—',
          t.type.replace(/_/g, ' '),
          t.note || '—',
          t.direction === 'credit' ? `₹${Number(t.amount).toLocaleString('en-IN')}` : '',
          t.direction === 'debit'  ? `₹${Number(t.amount).toLocaleString('en-IN')}` : '',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: {
          4: { halign: 'right', textColor: [22, 163, 74] },
          5: { halign: 'right', textColor: [220, 38, 38] },
        },
      })
    })
    setLoading(null)
  }

  const reports = [
    {
      id: 'monthly-pdf',
      title: 'Monthly summary',
      desc: `Group deposit report for ${monthName}`,
      tag: 'PDF',
      tagColor: 'bg-red-100 text-red-700',
      action: handleMonthlySummaryPDF,
    },
    {
      id: 'member-pdf',
      title: 'Member statements',
      desc: 'Individual statement for every member',
      tag: 'PDF',
      tagColor: 'bg-red-100 text-red-700',
      action: handleMemberStatementPDF,
    },
    {
      id: 'ledger-pdf',
      title: 'Transaction ledger',
      desc: 'Full printable audit trail',
      tag: 'PDF',
      tagColor: 'bg-red-100 text-red-700',
      action: handleLedgerPDF,
    },
    {
      id: 'deposits-csv',
      title: 'Deposits export',
      desc: `All deposit records for ${currentYear}`,
      tag: 'CSV',
      tagColor: 'bg-green-100 text-green-700',
      action: handleDepositsCSV,
    },
    {
      id: 'loans-csv',
      title: 'Loans export',
      desc: 'All loan records with status',
      tag: 'CSV',
      tagColor: 'bg-green-100 text-green-700',
      action: handleLoansCSV,
    },
    {
      id: 'excel',
      title: 'Full Excel workbook',
      desc: 'Members, deposits, loans & ledger in one file',
      tag: 'XLSX',
      tagColor: 'bg-blue-100 text-blue-700',
      action: handleFullExcel,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {reports.map(report => (
        <div key={report.id} className="bg-white border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-gray-800">{report.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{report.desc}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${report.tagColor}`}>
              {report.tag}
            </span>
          </div>
          <button
            onClick={report.action}
            disabled={loading === report.id}
            className="w-full text-sm border rounded-lg py-2 hover:bg-gray-50 transition disabled:opacity-50 text-gray-700"
          >
            {loading === report.id ? 'Generating...' : `Download ${report.tag}`}
          </button>
        </div>
      ))}
    </div>
  )
}