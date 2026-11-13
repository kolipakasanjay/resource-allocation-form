/**
 * PMI Pearl City Chapter (PMIPCC) Initial Data
 * Board Members & Portfolios taken from chapter structure
 * 9 Chapter Portfolios with exactly 5 designated Persons each (45 Persons total).
 */

const PMIPCC_PORTFOLIOS = [
  {
    id: "port-events",
    name: "Events",
    code: "EVT-01",
    status: "active",
    description: "Flagship chapter symposiums, PMI partner associations, industry webinars, and annual conferences.",
    leadPersonName: "Sivakumar G"
  },
  {
    id: "port-marcom",
    name: "Marcom",
    code: "MCM-02",
    status: "active",
    description: "Chapter communications, newsletters, social media marketing, official notices, and branding.",
    leadPersonName: "Vinay Babu Tarala"
  },
  {
    id: "port-social-impact",
    name: "Social Impact",
    code: "SOC-03",
    status: "active",
    description: "Social impact initiatives, youth development, sustainability projects, and community outreach.",
    leadPersonName: "Lata Kalla"
  },
  {
    id: "port-academia",
    name: "Academia",
    code: "ACD-04",
    status: "active",
    description: "University partnerships, student outreach, academic symposiums, and student chapter branches.",
    leadPersonName: "Dr. B. Rao"
  },
  {
    id: "port-academy",
    name: "Academy",
    code: "ACM-05",
    status: "active",
    description: "PMP/CAPM certifications training, agile workshops, continuous education units (PDUs), and masterclasses.",
    leadPersonName: "Sreevani Lakkaraju"
  },
  {
    id: "port-corporate",
    name: "Corporate",
    code: "CRP-06",
    status: "active",
    description: "Enterprise sponsorship, corporate tie-ups, B2B relations, and executive roundtables in Hyderabad tech hub.",
    leadPersonName: "Seshu Ganti"
  },
  {
    id: "port-volunteers",
    name: "Volunteers",
    code: "VOL-07",
    status: "active",
    description: "Volunteer recruitment, onboarding, engagement drives, recognition programs, and committee support.",
    leadPersonName: "Krishna Chaitanya"
  },
  {
    id: "port-membership",
    name: "Membership",
    code: "MBR-08",
    status: "active",
    description: "Member onboarding, retention drives, chapter engagement forums, and member support services.",
    leadPersonName: "Suresh Addepalli"
  },
  {
    id: "port-vizag",
    name: "Vizag",
    code: "VZG-09",
    status: "active",
    description: "Vizag branch activities, coastal Andhra outreach, regional networking forums, and local chapter events.",
    leadPersonName: "Manohar Yerraguntla"
  }
];

const PMIPCC_PEOPLE = [
  // 1. Events (5 persons)
  {
    id: "per-evt-1",
    name: "Sivakumar G",
    role: "VP Events",
    email: "sivakumar.g@pmi-pcc.org",
    portfolioId: "port-events",
    status: "active",
    initials: "SG"
  },
  {
    id: "per-evt-2",
    name: "Ananya Sharma",
    role: "Event Operations Lead",
    email: "ananya.sharma@pmi-pcc.org",
    portfolioId: "port-events",
    status: "active",
    initials: "AS"
  },
  {
    id: "per-evt-3",
    name: "Rajesh Varma",
    role: "Symposium Program Manager",
    email: "rajesh.varma@pmi-pcc.org",
    portfolioId: "port-events",
    status: "active",
    initials: "RV"
  },
  {
    id: "per-evt-4",
    name: "Kavitha Reddy",
    role: "Webinar Coordinator",
    email: "kavitha.reddy@pmi-pcc.org",
    portfolioId: "port-events",
    status: "active",
    initials: "KR"
  },
  {
    id: "per-evt-5",
    name: "Karthik Nambiar",
    role: "Annual Conference Logistics",
    email: "karthik.n@pmi-pcc.org",
    portfolioId: "port-events",
    status: "active",
    initials: "KN"
  },

  // 2. Marcom (5 persons)
  {
    id: "per-mcm-1",
    name: "Vinay Babu Tarala",
    role: "General Secretary & Marcom Lead",
    email: "vinay.babu@pmi-pcc.org",
    portfolioId: "port-marcom",
    status: "active",
    initials: "VBT"
  },
  {
    id: "per-mcm-2",
    name: "Priyanka Deshmukh",
    role: "Digital Marketing & Social Media",
    email: "priyanka.d@pmi-pcc.org",
    portfolioId: "port-marcom",
    status: "active",
    initials: "PD"
  },
  {
    id: "per-mcm-3",
    name: "Rahul Vankadari",
    role: "Newsletter Editor & Content",
    email: "rahul.v@pmi-pcc.org",
    portfolioId: "port-marcom",
    status: "active",
    initials: "RV"
  },
  {
    id: "per-mcm-4",
    name: "Sneha Kulkarni",
    role: "Brand & Creative Communications",
    email: "sneha.k@pmi-pcc.org",
    portfolioId: "port-marcom",
    status: "active",
    initials: "SK"
  },
  {
    id: "per-mcm-5",
    name: "Harish Kumar",
    role: "PR & Media Relations Specialist",
    email: "harish.k@pmi-pcc.org",
    portfolioId: "port-marcom",
    status: "active",
    initials: "HK"
  },

  // 3. Social Impact (5 persons)
  {
    id: "per-soc-1",
    name: "Lata Kalla",
    role: "Director Social Impact",
    email: "lata.kalla@pmi-pcc.org",
    portfolioId: "port-social-impact",
    status: "active",
    initials: "LK"
  },
  {
    id: "per-soc-2",
    name: "Manoj Prabhakar",
    role: "Youth Outreach Lead",
    email: "manoj.p@pmi-pcc.org",
    portfolioId: "port-social-impact",
    status: "active",
    initials: "MP"
  },
  {
    id: "per-soc-3",
    name: "Deepa Sundaram",
    role: "Community Sustainability Manager",
    email: "deepa.s@pmi-pcc.org",
    portfolioId: "port-social-impact",
    status: "active",
    initials: "DS"
  },
  {
    id: "per-soc-4",
    name: "Arvind Swaminathan",
    role: "NGO Partnerships Lead",
    email: "arvind.s@pmi-pcc.org",
    portfolioId: "port-social-impact",
    status: "active",
    initials: "AS"
  },
  {
    id: "per-soc-5",
    name: "Ritu Agarwal",
    role: "Social Impact Projects Lead",
    email: "ritu.a@pmi-pcc.org",
    portfolioId: "port-social-impact",
    status: "active",
    initials: "RA"
  },

  // 4. Academia (5 persons)
  {
    id: "per-acd-1",
    name: "Dr. B. Rao",
    role: "Director Academia",
    email: "b.rao@pmi-pcc.org",
    portfolioId: "port-academia",
    status: "active",
    initials: "BR"
  },
  {
    id: "per-acd-2",
    name: "Prof. Lakshmi Narayana",
    role: "University Partnerships Lead",
    email: "lakshmi.n@pmi-pcc.org",
    portfolioId: "port-academia",
    status: "active",
    initials: "LN"
  },
  {
    id: "per-acd-3",
    name: "Meenakshi Sundaram",
    role: "Student Chapter Advisor",
    email: "meenakshi.s@pmi-pcc.org",
    portfolioId: "port-academia",
    status: "active",
    initials: "MS"
  },
  {
    id: "per-acd-4",
    name: "Dr. S. K. Murthy",
    role: "Academic Research & Symposium",
    email: "sk.murthy@pmi-pcc.org",
    portfolioId: "port-academia",
    status: "active",
    initials: "SKM"
  },
  {
    id: "per-acd-5",
    name: "Tanvi Saxena",
    role: "Campus Outreach Coordinator",
    email: "tanvi.s@pmi-pcc.org",
    portfolioId: "port-academia",
    status: "active",
    initials: "TS"
  },

  // 5. Academy (5 persons)
  {
    id: "per-acm-1",
    name: "Sreevani Lakkaraju",
    role: "Director Academy",
    email: "sreevani.l@pmi-pcc.org",
    portfolioId: "port-academy",
    status: "active",
    initials: "SL"
  },
  {
    id: "per-acm-2",
    name: "Venkat Ramanan",
    role: "PMP/CAPM Master Trainer",
    email: "venkat.r@pmi-pcc.org",
    portfolioId: "port-academy",
    status: "active",
    initials: "VR"
  },
  {
    id: "per-acm-3",
    name: "Pooja Hegde",
    role: "Agile & ACP Workshop Lead",
    email: "pooja.h@pmi-pcc.org",
    portfolioId: "port-academy",
    status: "active",
    initials: "PH"
  },
  {
    id: "per-acm-4",
    name: "Sudhir Kancharla",
    role: "Continuous Education & PDU Manager",
    email: "sudhir.k@pmi-pcc.org",
    portfolioId: "port-academy",
    status: "active",
    initials: "SK"
  },
  {
    id: "per-acm-5",
    name: "Neha Choudhary",
    role: "Certification Curriculum Specialist",
    email: "neha.c@pmi-pcc.org",
    portfolioId: "port-academy",
    status: "active",
    initials: "NC"
  },

  // 6. Corporate (5 persons)
  {
    id: "per-crp-1",
    name: "Seshu Ganti",
    role: "Director Corporate Outreach",
    email: "seshu.ganti@pmi-pcc.org",
    portfolioId: "port-corporate",
    status: "active",
    initials: "SG"
  },
  {
    id: "per-crp-2",
    name: "Vikramaditya Reddy",
    role: "Enterprise Sponsorship Lead",
    email: "vikram.r@pmi-pcc.org",
    portfolioId: "port-corporate",
    status: "active",
    initials: "VR"
  },
  {
    id: "per-crp-3",
    name: "Archana Iyer",
    role: "B2B Strategic Alliances Manager",
    email: "archana.i@pmi-pcc.org",
    portfolioId: "port-corporate",
    status: "active",
    initials: "AI"
  },
  {
    id: "per-crp-4",
    name: "Naveen Polishetty",
    role: "Corporate Roundtables Lead",
    email: "naveen.p@pmi-pcc.org",
    portfolioId: "port-corporate",
    status: "active",
    initials: "NP"
  },
  {
    id: "per-crp-5",
    name: "Sunita Menon",
    role: "Industry Engagement Specialist",
    email: "sunita.m@pmi-pcc.org",
    portfolioId: "port-corporate",
    status: "active",
    initials: "SM"
  },

  // 7. Volunteers (5 persons)
  {
    id: "per-vol-1",
    name: "Krishna Chaitanya",
    role: "Treasurer & Volunteers Lead",
    email: "krishna.c@pmi-pcc.org",
    portfolioId: "port-volunteers",
    status: "active",
    initials: "KC"
  },
  {
    id: "per-vol-2",
    name: "Swathi Ramanathan",
    role: "Volunteer Engagement Coordinator",
    email: "swathi.r@pmi-pcc.org",
    portfolioId: "port-volunteers",
    status: "active",
    initials: "SR"
  },
  {
    id: "per-vol-3",
    name: "Nitin Gadgil",
    role: "Talent Onboarding & Recognition",
    email: "nitin.g@pmi-pcc.org",
    portfolioId: "port-volunteers",
    status: "active",
    initials: "NG"
  },
  {
    id: "per-vol-4",
    name: "Divya Teja",
    role: "Volunteer Operations Manager",
    email: "divya.t@pmi-pcc.org",
    portfolioId: "port-volunteers",
    status: "active",
    initials: "DT"
  },
  {
    id: "per-vol-5",
    name: "Rohit Bhargava",
    role: "Volunteer Community Liaison",
    email: "rohit.b@pmi-pcc.org",
    portfolioId: "port-volunteers",
    status: "active",
    initials: "RB"
  },

  // 8. Membership (5 persons)
  {
    id: "per-mbr-1",
    name: "Suresh Addepalli",
    role: "Director Membership",
    email: "suresh.a@pmi-pcc.org",
    portfolioId: "port-membership",
    status: "active",
    initials: "SA"
  },
  {
    id: "per-mbr-2",
    name: "Bhavana Joshi",
    role: "Member Onboarding Specialist",
    email: "bhavana.j@pmi-pcc.org",
    portfolioId: "port-membership",
    status: "active",
    initials: "BJ"
  },
  {
    id: "per-mbr-3",
    name: "Sandeep Kothari",
    role: "Retention & Renewal Manager",
    email: "sandeep.k@pmi-pcc.org",
    portfolioId: "port-membership",
    status: "active",
    initials: "SK"
  },
  {
    id: "per-mbr-4",
    name: "Shalini Nambisan",
    role: "Member Experience & Networking",
    email: "shalini.n@pmi-pcc.org",
    portfolioId: "port-membership",
    status: "active",
    initials: "SN"
  },
  {
    id: "per-mbr-5",
    name: "Tarun Vemula",
    role: "Chapter Engagement Liaison",
    email: "tarun.v@pmi-pcc.org",
    portfolioId: "port-membership",
    status: "active",
    initials: "TV"
  },

  // 9. Vizag (5 persons)
  {
    id: "per-vzg-1",
    name: "Manohar Yerraguntla",
    role: "President / Vizag Branch Lead",
    email: "manohar.y@pmi-pcc.org",
    portfolioId: "port-vizag",
    status: "active",
    initials: "MY"
  },
  {
    id: "per-vzg-2",
    name: "Prasad Patnaik",
    role: "Vizag Regional Coordinator",
    email: "prasad.p@pmi-pcc.org",
    portfolioId: "port-vizag",
    status: "active",
    initials: "PP"
  },
  {
    id: "per-vzg-3",
    name: "Sailaja Viswanathan",
    role: "Coastal Andhra Events Lead",
    email: "sailaja.v@pmi-pcc.org",
    portfolioId: "port-vizag",
    status: "active",
    initials: "SV"
  },
  {
    id: "per-vzg-4",
    name: "Kiran Kumar V",
    role: "Vizag Member Networking",
    email: "kiran.v@pmi-pcc.org",
    portfolioId: "port-vizag",
    status: "active",
    initials: "KKV"
  },
  {
    id: "per-vzg-5",
    name: "Geetha Madhuri",
    role: "Vizag Student Chapter Outreach",
    email: "geetha.m@pmi-pcc.org",
    portfolioId: "port-vizag",
    status: "active",
    initials: "GM"
  }
];

const CALENDAR_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getPastThreeMonths(targetMonth) {
  const idx = CALENDAR_MONTHS.indexOf(targetMonth);
  if (idx === -1) return ["August", "September", "October"];

  const m1 = CALENDAR_MONTHS[(idx - 2 + 12) % 12];
  const m2 = CALENDAR_MONTHS[(idx - 1 + 12) % 12];
  const m3 = CALENDAR_MONTHS[idx];

  return [m1, m2, m3];
}

// Initial allocation records from chapter central register (21 records)
const INITIAL_LOGS = [
  {
    "id": "log-1794482073602-0-8a1",
    "batchId": "batch-1794482073602",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "July",
    "hours": 0,
    "comments": "",
    "submittedAt": "2026-11-12T11:14:33.599Z"
  },
  {
    "id": "log-1794482073602-1-huw",
    "batchId": "batch-1794482073602",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "October",
    "hours": 0,
    "comments": "",
    "submittedAt": "2026-11-12T11:14:33.599Z"
  },
  {
    "id": "log-1794481574641-0-lg9",
    "batchId": "batch-1794481574641",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "February",
    "hours": 19.5,
    "comments": "",
    "submittedAt": "2026-11-12T11:06:14.641Z"
  },
  {
    "id": "log-1794481574641-1-k1t",
    "batchId": "batch-1794481574641",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "November",
    "hours": 19.5,
    "comments": "",
    "submittedAt": "2026-11-12T11:06:14.641Z"
  },
  {
    "id": "log-1794481574641-2-6x4",
    "batchId": "batch-1794481574641",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-2",
    "personName": "Ananya Sharma",
    "personRole": "Event Operations Lead",
    "year": 2026,
    "month": "September",
    "hours": 17,
    "comments": "",
    "submittedAt": "2026-11-12T11:06:14.641Z"
  },
  {
    "id": "log-1794481422561-0-xjw",
    "batchId": "batch-1794481422561",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "August",
    "hours": 22,
    "comments": "",
    "submittedAt": "2026-11-12T11:03:42.561Z"
  },
  {
    "id": "log-1794480378512-0-0vd",
    "batchId": "batch-1794480378512",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "July",
    "hours": 20,
    "comments": "",
    "submittedAt": "2026-11-12T10:46:18.511Z"
  },
  {
    "id": "log-1794478540253-0-imv",
    "batchId": "batch-1794478540253",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-2",
    "personName": "Ananya Sharma",
    "personRole": "Event Operations Lead",
    "year": 2026,
    "month": "September",
    "hours": 22,
    "comments": "",
    "submittedAt": "2026-11-12T10:15:40.253Z"
  },
  {
    "id": "log-1794140471285-0-g0o",
    "batchId": "batch-1794140471285",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-2",
    "personName": "Ananya Sharma",
    "personRole": "Event Operations Lead",
    "year": 2026,
    "month": "February",
    "hours": 20,
    "comments": "",
    "submittedAt": "2026-11-08T12:21:11.285Z"
  },
  {
    "id": "log-1794137971920-0-duv",
    "batchId": "batch-1794137971920",
    "portfolioId": "port-marcom",
    "portfolioName": "Marcom",
    "personId": "per-mcm-1",
    "personName": "Vinay Babu Tarala",
    "personRole": "General Secretary & Marcom Lead",
    "year": 2026,
    "month": "September",
    "hours": 13.5,
    "comments": "",
    "submittedAt": "2026-11-08T11:39:31.920Z"
  },
  {
    "id": "log-1794136222297-0-7kk",
    "batchId": "batch-1794136222297",
    "portfolioId": "port-marcom",
    "portfolioName": "Marcom",
    "personId": "per-mcm-1",
    "personName": "Vinay Babu Tarala",
    "personRole": "General Secretary & Marcom Lead",
    "year": 2026,
    "month": "January",
    "hours": 20,
    "comments": "",
    "submittedAt": "2026-11-08T11:10:22.297Z"
  },
  {
    "id": "log-1794136222297-1-7gv",
    "batchId": "batch-1794136222297",
    "portfolioId": "port-marcom",
    "portfolioName": "Marcom",
    "personId": "per-mcm-1",
    "personName": "Vinay Babu Tarala",
    "personRole": "General Secretary & Marcom Lead",
    "year": 2026,
    "month": "February",
    "hours": 24,
    "comments": "",
    "submittedAt": "2026-11-08T11:10:22.297Z"
  },
  {
    "id": "log-1794136222297-2-yzi",
    "batchId": "batch-1794136222297",
    "portfolioId": "port-marcom",
    "portfolioName": "Marcom",
    "personId": "per-mcm-2",
    "personName": "Priyanka Deshmukh",
    "personRole": "Digital Marketing & Social Media",
    "year": 2026,
    "month": "January",
    "hours": 20,
    "comments": "",
    "submittedAt": "2026-11-08T11:10:22.297Z"
  },
  {
    "id": "log-1794136171629-0-dpl",
    "batchId": "batch-1794136171629",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "February",
    "hours": 33,
    "comments": "",
    "submittedAt": "2026-11-08T11:09:31.629Z"
  },
  {
    "id": "log-1794136171629-1-69a",
    "batchId": "batch-1794136171629",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "June",
    "hours": 33,
    "comments": "",
    "submittedAt": "2026-11-08T11:09:31.629Z"
  },
  {
    "id": "log-1794135533793-0-85t",
    "batchId": "batch-1794135533792",
    "portfolioId": "port-marcom",
    "portfolioName": "Marcom",
    "personId": "per-mcm-1",
    "personName": "Vinay Babu Tarala",
    "personRole": "General Secretary & Marcom Lead",
    "year": 2026,
    "month": "January",
    "hours": 20,
    "comments": "Quarterly chapter communications update",
    "submittedAt": "2026-11-08T10:58:53.792Z"
  },
  {
    "id": "log-1794135533793-1-9fv",
    "batchId": "batch-1794135533792",
    "portfolioId": "port-marcom",
    "portfolioName": "Marcom",
    "personId": "per-mcm-1",
    "personName": "Vinay Babu Tarala",
    "personRole": "General Secretary & Marcom Lead",
    "year": 2026,
    "month": "February",
    "hours": 20,
    "comments": "",
    "submittedAt": "2026-11-08T10:58:53.792Z"
  },
  {
    "id": "log-1793874459419-0-4xc",
    "batchId": "batch-1793874459419",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "August",
    "hours": 40,
    "comments": "Annual conference planning & speaker alignment",
    "submittedAt": "2026-11-05T10:27:39.419Z"
  },
  {
    "id": "log-1793874459419-1-0gd",
    "batchId": "batch-1793874459419",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "September",
    "hours": 20,
    "comments": "Regional symposium logistics",
    "submittedAt": "2026-11-05T10:27:39.419Z"
  },
  {
    "id": "log-1793874459419-2-3as",
    "batchId": "batch-1793874459419",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Sivakumar G",
    "personRole": "VP Events",
    "year": 2026,
    "month": "October",
    "hours": 10,
    "comments": "Chapter board meeting & portfolio reviews",
    "submittedAt": "2026-11-05T10:27:39.419Z"
  },
  {
    "id": "log-test-sync-1",
    "portfolioId": "port-events",
    "portfolioName": "Events",
    "personId": "per-evt-1",
    "personName": "Vinay Babu",
    "personRole": "Events Lead",
    "year": 2026,
    "month": "August",
    "hours": 20,
    "comments": "Cross-device sync verification entry",
    "submittedAt": "2026-11-05T09:00:00.000Z"
  }
];

window.INITIAL_DATA = {
  portfolios: PMIPCC_PORTFOLIOS,
  people: PMIPCC_PEOPLE,
  months: CALENDAR_MONTHS,
  logs: INITIAL_LOGS,
  getPastThreeMonths
};
