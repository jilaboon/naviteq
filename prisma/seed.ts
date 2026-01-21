import { PrismaClient, Role, ProjectStatus, ProjectPriority, SeniorityLevel, RemotePolicy, CandidateStage, EmploymentStatus, DevOpsStatus, AssignmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.projectUpdate.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.engineerUpdate.deleteMany()
  await prisma.engineerAssignment.deleteMany()
  await prisma.projectTalent.deleteMany()
  await prisma.projectCandidate.deleteMany()
  await prisma.projectAssignment.deleteMany()
  await prisma.project.deleteMany()
  await prisma.engineer.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data')

  // Create Users
  const passwordHash = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@naviteq.com',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  })

  const sales = await prisma.user.create({
    data: {
      fullName: 'Sarah Sales',
      email: 'sarah@naviteq.com',
      passwordHash,
      role: Role.SALES,
      isActive: true,
    },
  })

  const recruiter = await prisma.user.create({
    data: {
      fullName: 'Rachel Recruiter',
      email: 'rachel@naviteq.com',
      passwordHash,
      role: Role.RECRUITER,
      isActive: true,
    },
  })

  const clientManager = await prisma.user.create({
    data: {
      fullName: 'Michael Manager',
      email: 'michael@naviteq.com',
      passwordHash,
      role: Role.CLIENT_MANAGER,
      isActive: true,
    },
  })

  console.log('Created users')

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'TechCorp Ltd',
        industry: 'Technology',
        website: 'https://techcorp.example.com',
        description: 'Leading enterprise software company specializing in cloud solutions',
        contacts: [
          { name: 'John Smith', title: 'CTO', email: 'john@techcorp.com', phone: '+972-50-111-1111' },
          { name: 'Emily Brown', title: 'HR Director', email: 'emily@techcorp.com', phone: '+972-50-222-2222' },
        ],
        notes: 'Long-term client, prefers senior developers',
        tags: ['enterprise', 'cloud', 'priority'],
        ownerUserId: sales.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'FinanceHub',
        industry: 'FinTech',
        website: 'https://financehub.example.com',
        description: 'Innovative fintech startup focused on payment solutions',
        contacts: [
          { name: 'David Cohen', title: 'VP Engineering', email: 'david@financehub.com', phone: '+972-50-333-3333' },
        ],
        notes: 'Fast-growing startup, urgent hiring needs',
        tags: ['fintech', 'startup', 'fast-paced'],
        ownerUserId: sales.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'HealthTech Solutions',
        industry: 'Healthcare',
        website: 'https://healthtech.example.com',
        description: 'Healthcare technology company building patient management systems',
        contacts: [
          { name: 'Lisa Green', title: 'CEO', email: 'lisa@healthtech.com', phone: '+972-50-444-4444' },
          { name: 'Mark Taylor', title: 'Tech Lead', email: 'mark@healthtech.com', phone: '+972-50-555-5555' },
        ],
        notes: 'Requires healthcare domain experience',
        tags: ['healthcare', 'compliance', 'security'],
        ownerUserId: clientManager.id,
      },
    }),
  ])

  console.log('Created customers')

  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        customerId: customers[0].id,
        title: 'Senior Full Stack Developer',
        description: 'Looking for an experienced full-stack developer to lead our cloud platform team',
        technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
        mustHave: ['5+ years experience', 'Team leadership', 'AWS certification'],
        niceToHave: ['Kubernetes', 'GraphQL', 'Microservices architecture'],
        seniorityLevel: SeniorityLevel.SENIOR,
        yearsExperienceMin: 5,
        location: 'Tel Aviv',
        remotePolicy: RemotePolicy.HYBRID,
        languageRequirements: ['English', 'Hebrew'],
        headcount: 2,
        priority: ProjectPriority.HIGH,
        status: ProjectStatus.SOURCING,
        assignedUsers: {
          create: [
            { userId: sales.id },
            { userId: recruiter.id },
            { userId: clientManager.id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[0].id,
        title: 'DevOps Engineer',
        description: 'DevOps engineer to improve CI/CD pipelines and infrastructure',
        technologies: ['Kubernetes', 'Terraform', 'Jenkins', 'AWS', 'Python'],
        mustHave: ['CI/CD expertise', 'Cloud infrastructure', 'Linux administration'],
        niceToHave: ['GCP experience', 'Security certifications'],
        seniorityLevel: SeniorityLevel.MID,
        yearsExperienceMin: 3,
        location: 'Tel Aviv',
        remotePolicy: RemotePolicy.REMOTE,
        headcount: 1,
        priority: ProjectPriority.MEDIUM,
        status: ProjectStatus.INTERVIEWS,
        assignedUsers: {
          create: [{ userId: recruiter.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[1].id,
        title: 'Backend Developer - Python',
        description: 'Python backend developer for payment processing system',
        technologies: ['Python', 'Django', 'PostgreSQL', 'Redis', 'RabbitMQ'],
        mustHave: ['Python expertise', 'REST API design', 'Database optimization'],
        niceToHave: ['Payment systems experience', 'FinTech background'],
        seniorityLevel: SeniorityLevel.MID,
        yearsExperienceMin: 3,
        location: 'Herzliya',
        remotePolicy: RemotePolicy.HYBRID,
        languageRequirements: ['English'],
        headcount: 3,
        priority: ProjectPriority.URGENT,
        status: ProjectStatus.SOURCING,
        assignedUsers: {
          create: [{ userId: sales.id }, { userId: recruiter.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[1].id,
        title: 'React Native Developer',
        description: 'Mobile developer for fintech mobile app',
        technologies: ['React Native', 'TypeScript', 'Redux', 'Jest'],
        mustHave: ['React Native experience', 'iOS/Android deployment'],
        niceToHave: ['Native iOS/Android knowledge'],
        seniorityLevel: SeniorityLevel.SENIOR,
        yearsExperienceMin: 4,
        location: 'Remote',
        remotePolicy: RemotePolicy.REMOTE,
        headcount: 1,
        priority: ProjectPriority.HIGH,
        status: ProjectStatus.INITIAL,
        assignedUsers: {
          create: [{ userId: sales.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[2].id,
        title: 'Java Backend Developer',
        description: 'Java developer for healthcare management system',
        technologies: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'Kafka'],
        mustHave: ['Java 11+', 'Spring framework', 'Healthcare compliance knowledge'],
        niceToHave: ['HIPAA experience', 'HL7/FHIR'],
        seniorityLevel: SeniorityLevel.SENIOR,
        yearsExperienceMin: 5,
        location: 'Ramat Gan',
        remotePolicy: RemotePolicy.ONSITE,
        languageRequirements: ['English', 'Hebrew'],
        headcount: 2,
        priority: ProjectPriority.MEDIUM,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: clientManager.id }, { userId: recruiter.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[2].id,
        title: 'QA Automation Engineer',
        description: 'QA engineer to build automated testing framework',
        technologies: ['Selenium', 'Python', 'Jenkins', 'TestRail'],
        mustHave: ['Test automation', 'CI/CD integration'],
        niceToHave: ['Healthcare testing experience'],
        seniorityLevel: SeniorityLevel.MID,
        yearsExperienceMin: 2,
        location: 'Ramat Gan',
        remotePolicy: RemotePolicy.HYBRID,
        headcount: 1,
        priority: ProjectPriority.LOW,
        status: ProjectStatus.CLOSED_LOST,
        assignedUsers: {
          create: [{ userId: recruiter.id }],
        },
      },
    }),
  ])

  console.log('Created projects')

  // Create Candidates
  const candidatesData = [
    {
      fullName: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      phone: '+972-50-111-2222',
      location: 'Tel Aviv',
      title: 'Senior Full Stack Developer',
      summaryPublic: 'Experienced full-stack developer with 7 years in web development',
      summaryInternal: 'Strong technical skills, good communication. Looking for team lead role. Currently at BigTech, earning 45k NIS.',
      technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker', 'GraphQL'],
      yearsExperience: 7,
      seniorityLevel: SeniorityLevel.SENIOR,
      languages: ['English', 'Hebrew'],
      availability: 'Immediate',
      salaryExpectation: '50-55k NIS',
      resumeExtractedText: 'Senior Full Stack Developer with 7 years of experience. Expert in React, Node.js, TypeScript. Led team of 5 developers at BigTech. AWS certified. Built scalable microservices architecture handling 1M+ requests/day.',
      interviewNotes: [
        { interviewerName: 'Rachel Recruiter', date: '2024-01-10', notes: 'Excellent technical skills, good cultural fit', score: 5 },
      ],
      tags: ['available', 'senior', 'full-stack'],
    },
    {
      fullName: 'Maya Cohen',
      email: 'maya.cohen@email.com',
      phone: '+972-50-333-4444',
      location: 'Herzliya',
      title: 'Python Backend Developer',
      summaryPublic: 'Backend developer specializing in Python and data systems',
      summaryInternal: 'Strong Python skills, fintech experience from previous role. Prefers hybrid work.',
      technologies: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'AWS'],
      yearsExperience: 4,
      seniorityLevel: SeniorityLevel.MID,
      languages: ['English', 'Hebrew', 'Russian'],
      availability: '2 weeks notice',
      salaryExpectation: '35-40k NIS',
      resumeExtractedText: 'Python Backend Developer with 4 years experience. Worked at FinTech startup building payment APIs. Expertise in Django, FastAPI, PostgreSQL. Built high-throughput transaction processing system.',
      interviewNotes: [],
      tags: ['python', 'fintech', 'mid-level'],
    },
    {
      fullName: 'Daniel Levi',
      email: 'daniel.levi@email.com',
      phone: '+972-50-555-6666',
      location: 'Tel Aviv',
      title: 'DevOps Engineer',
      summaryPublic: 'DevOps engineer with strong cloud and automation skills',
      summaryInternal: 'AWS certified, excellent CI/CD knowledge. Open to relocation.',
      technologies: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Jenkins', 'Python', 'Bash'],
      yearsExperience: 5,
      seniorityLevel: SeniorityLevel.SENIOR,
      languages: ['English', 'Hebrew'],
      availability: 'Immediate',
      salaryExpectation: '45-50k NIS',
      resumeExtractedText: 'DevOps Engineer with 5 years experience. AWS Solutions Architect certified. Implemented Kubernetes clusters handling 500+ microservices. Expert in Terraform, CI/CD pipelines.',
      interviewNotes: [
        { interviewerName: 'Rachel Recruiter', date: '2024-01-05', notes: 'Strong DevOps skills, AWS certified', score: 4 },
      ],
      tags: ['devops', 'aws', 'kubernetes'],
    },
    {
      fullName: 'Sarah Ben-David',
      email: 'sarah.bd@email.com',
      phone: '+972-50-777-8888',
      location: 'Remote',
      title: 'React Native Developer',
      summaryPublic: 'Mobile developer with 5 years of React Native experience',
      summaryInternal: 'Shipped 10+ apps to store. Strong UI/UX sense. Prefers fully remote.',
      technologies: ['React Native', 'TypeScript', 'Redux', 'Jest', 'React', 'JavaScript'],
      yearsExperience: 5,
      seniorityLevel: SeniorityLevel.SENIOR,
      languages: ['English', 'Hebrew'],
      availability: '1 month notice',
      salaryExpectation: '40-45k NIS',
      resumeExtractedText: 'React Native Developer with 5 years experience. Published 10+ apps with millions of downloads. Expert in TypeScript, Redux, performance optimization.',
      interviewNotes: [],
      tags: ['mobile', 'react-native', 'remote-only'],
    },
    {
      fullName: 'Yossi Avraham',
      email: 'yossi.a@email.com',
      phone: '+972-50-999-0000',
      location: 'Ramat Gan',
      title: 'Java Backend Developer',
      summaryPublic: 'Senior Java developer with healthcare industry experience',
      summaryInternal: 'HIPAA certified, excellent domain knowledge. Looking for stable position.',
      technologies: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'Kafka', 'Docker'],
      yearsExperience: 8,
      seniorityLevel: SeniorityLevel.SENIOR,
      languages: ['English', 'Hebrew'],
      availability: 'Immediate',
      salaryExpectation: '55-60k NIS',
      resumeExtractedText: 'Senior Java Developer with 8 years experience. 4 years in healthcare sector. HIPAA compliance certified. Built patient management systems serving 500k+ patients.',
      interviewNotes: [
        { interviewerName: 'Rachel Recruiter', date: '2024-01-08', notes: 'Perfect fit for healthcare projects', score: 5 },
      ],
      tags: ['java', 'healthcare', 'senior'],
    },
    // Add more candidates for variety
    {
      fullName: 'Noa Shapira',
      email: 'noa.s@email.com',
      phone: '+972-50-123-4567',
      location: 'Tel Aviv',
      title: 'Frontend Developer',
      summaryPublic: 'Frontend specialist with React expertise',
      summaryInternal: 'Strong React skills, good design sense.',
      technologies: ['React', 'TypeScript', 'CSS', 'Tailwind', 'Next.js'],
      yearsExperience: 3,
      seniorityLevel: SeniorityLevel.MID,
      languages: ['English', 'Hebrew'],
      availability: '2 weeks',
      salaryExpectation: '30-35k NIS',
      resumeExtractedText: 'Frontend Developer with 3 years React experience. Built complex SPAs for enterprise clients.',
      interviewNotes: [],
      tags: ['frontend', 'react'],
    },
    {
      fullName: 'Tom Miller',
      email: 'tom.m@email.com',
      phone: '+972-50-234-5678',
      location: 'Herzliya',
      title: 'Junior Developer',
      summaryPublic: 'Motivated junior developer looking to grow',
      summaryInternal: 'Recent bootcamp graduate, eager to learn.',
      technologies: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      yearsExperience: 1,
      seniorityLevel: SeniorityLevel.JUNIOR,
      languages: ['English'],
      availability: 'Immediate',
      salaryExpectation: '18-22k NIS',
      resumeExtractedText: 'Junior Developer. Bootcamp graduate. Built several personal projects using React and Node.js.',
      interviewNotes: [],
      tags: ['junior', 'bootcamp'],
    },
    {
      fullName: 'Elena Petrov',
      email: 'elena.p@email.com',
      phone: '+972-50-345-6789',
      location: 'Tel Aviv',
      title: 'Data Engineer',
      summaryPublic: 'Data engineer with Python and big data expertise',
      summaryInternal: 'Strong analytical skills, ML background.',
      technologies: ['Python', 'Spark', 'Airflow', 'AWS', 'PostgreSQL', 'Kafka'],
      yearsExperience: 4,
      seniorityLevel: SeniorityLevel.MID,
      languages: ['English', 'Russian', 'Hebrew'],
      availability: '1 month',
      salaryExpectation: '38-42k NIS',
      resumeExtractedText: 'Data Engineer with 4 years experience. Built data pipelines processing TB of data daily. Expert in Spark, Airflow.',
      interviewNotes: [],
      tags: ['data', 'python', 'big-data'],
    },
    {
      fullName: 'Amit Goldberg',
      email: 'amit.g@email.com',
      phone: '+972-50-456-7890',
      location: 'Tel Aviv',
      title: 'Tech Lead',
      summaryPublic: 'Experienced tech lead with full-stack background',
      summaryInternal: 'Strong leadership, looking for architect role.',
      technologies: ['React', 'Node.js', 'Python', 'AWS', 'Kubernetes', 'PostgreSQL'],
      yearsExperience: 10,
      seniorityLevel: SeniorityLevel.LEAD,
      languages: ['English', 'Hebrew'],
      availability: '2 months',
      salaryExpectation: '60-70k NIS',
      resumeExtractedText: 'Tech Lead with 10 years experience. Led teams of 15+ developers. Architected systems serving millions of users.',
      interviewNotes: [],
      tags: ['lead', 'architect', 'senior'],
    },
    {
      fullName: 'Rina Katz',
      email: 'rina.k@email.com',
      phone: '+972-50-567-8901',
      location: 'Netanya',
      title: 'QA Engineer',
      summaryPublic: 'QA engineer with automation expertise',
      summaryInternal: 'Strong automation skills, detail-oriented.',
      technologies: ['Selenium', 'Python', 'JavaScript', 'Cypress', 'Jenkins'],
      yearsExperience: 3,
      seniorityLevel: SeniorityLevel.MID,
      languages: ['English', 'Hebrew'],
      availability: 'Immediate',
      salaryExpectation: '28-32k NIS',
      resumeExtractedText: 'QA Automation Engineer with 3 years experience. Built test frameworks from scratch. Expert in Selenium, Cypress.',
      interviewNotes: [],
      tags: ['qa', 'automation'],
    },
  ]

  // Add 20 more candidates with varied profiles
  for (let i = 0; i < 20; i++) {
    const techs = [
      ['React', 'TypeScript', 'Node.js'],
      ['Python', 'Django', 'PostgreSQL'],
      ['Java', 'Spring Boot', 'MySQL'],
      ['Go', 'Kubernetes', 'Docker'],
      ['Ruby', 'Rails', 'Redis'],
      ['Vue.js', 'Nuxt', 'MongoDB'],
      ['Angular', 'RxJS', '.NET'],
      ['Swift', 'iOS', 'Objective-C'],
      ['Kotlin', 'Android', 'Firebase'],
      ['Rust', 'WebAssembly', 'C++'],
    ][i % 10]

    const seniority = [SeniorityLevel.JUNIOR, SeniorityLevel.MID, SeniorityLevel.SENIOR, SeniorityLevel.LEAD][i % 4]
    const years = { JUNIOR: 1, MID: 3, SENIOR: 6, LEAD: 9 }[seniority]

    candidatesData.push({
      fullName: `Candidate ${i + 11}`,
      email: `candidate${i + 11}@email.com`,
      phone: `+972-50-${100 + i}-${1000 + i}`,
      location: ['Tel Aviv', 'Herzliya', 'Ramat Gan', 'Netanya', 'Jerusalem'][i % 5],
      title: `${seniority.charAt(0) + seniority.slice(1).toLowerCase()} Developer`,
      summaryPublic: `Developer with ${years} years of experience in ${techs.join(', ')}`,
      summaryInternal: `Good candidate for ${techs[0]} positions.`,
      technologies: techs,
      yearsExperience: years,
      seniorityLevel: seniority,
      languages: ['English', 'Hebrew'],
      availability: ['Immediate', '2 weeks', '1 month'][i % 3],
      salaryExpectation: `${20 + years * 5}-${25 + years * 5}k NIS`,
      resumeExtractedText: `Developer with ${years} years of experience. Expertise in ${techs.join(', ')}. Built various applications and systems.`,
      interviewNotes: [],
      tags: [techs[0].toLowerCase(), seniority.toLowerCase()],
    })
  }

  const candidates = await Promise.all(
    candidatesData.map((data) =>
      prisma.candidate.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          location: data.location,
          title: data.title,
          summaryPublic: data.summaryPublic,
          summaryInternal: data.summaryInternal,
          technologies: data.technologies,
          yearsExperience: data.yearsExperience,
          seniorityLevel: data.seniorityLevel,
          languages: data.languages,
          availability: data.availability,
          salaryExpectation: data.salaryExpectation,
          resumeExtractedText: data.resumeExtractedText,
          interviewNotes: data.interviewNotes,
          tags: data.tags,
        },
      })
    )
  )

  console.log(`Created ${candidates.length} candidates`)

  // Create ProjectCandidates (submissions)
  const projectCandidates = [
    // Project 1 - Senior Full Stack Developer
    { projectIndex: 0, candidateIndex: 0, stage: CandidateStage.INTERVIEWING, matchScore: 92 },
    { projectIndex: 0, candidateIndex: 8, stage: CandidateStage.SUBMITTED_TO_CLIENT, matchScore: 85 },
    { projectIndex: 0, candidateIndex: 5, stage: CandidateStage.SHORTLISTED, matchScore: 75 },

    // Project 2 - DevOps Engineer
    { projectIndex: 1, candidateIndex: 2, stage: CandidateStage.INTERVIEWING, matchScore: 95 },

    // Project 3 - Python Backend Developer
    { projectIndex: 2, candidateIndex: 1, stage: CandidateStage.CONTACTED, matchScore: 90 },
    { projectIndex: 2, candidateIndex: 7, stage: CandidateStage.SHORTLISTED, matchScore: 72 },

    // Project 4 - React Native Developer
    { projectIndex: 3, candidateIndex: 3, stage: CandidateStage.SHORTLISTED, matchScore: 88 },

    // Project 5 - Java Backend Developer (closed won - has hired)
    { projectIndex: 4, candidateIndex: 4, stage: CandidateStage.HIRED, matchScore: 96 },

    // Additional submissions
    { projectIndex: 0, candidateIndex: 10, stage: CandidateStage.REJECTED, matchScore: 45 },
    { projectIndex: 0, candidateIndex: 11, stage: CandidateStage.SHORTLISTED, matchScore: 68 },
    { projectIndex: 2, candidateIndex: 12, stage: CandidateStage.CONTACTED, matchScore: 70 },
    { projectIndex: 2, candidateIndex: 13, stage: CandidateStage.SHORTLISTED, matchScore: 65 },
    { projectIndex: 1, candidateIndex: 14, stage: CandidateStage.REJECTED, matchScore: 40 },
    { projectIndex: 3, candidateIndex: 15, stage: CandidateStage.SHORTLISTED, matchScore: 55 },
    { projectIndex: 4, candidateIndex: 16, stage: CandidateStage.REJECTED, matchScore: 50 },
    { projectIndex: 0, candidateIndex: 17, stage: CandidateStage.SHORTLISTED, matchScore: 78 },
    { projectIndex: 2, candidateIndex: 18, stage: CandidateStage.SHORTLISTED, matchScore: 62 },
    { projectIndex: 1, candidateIndex: 19, stage: CandidateStage.SHORTLISTED, matchScore: 58 },
    { projectIndex: 3, candidateIndex: 20, stage: CandidateStage.CONTACTED, matchScore: 72 },
    { projectIndex: 0, candidateIndex: 21, stage: CandidateStage.SHORTLISTED, matchScore: 80 },
  ]

  await Promise.all(
    projectCandidates.map((pc) =>
      prisma.projectCandidate.create({
        data: {
          projectId: projects[pc.projectIndex].id,
          candidateId: candidates[pc.candidateIndex].id,
          stage: pc.stage,
          matchScore: pc.matchScore,
          matchReasons: [
            `${pc.matchScore}% technology match`,
            'Meets seniority requirements',
            pc.matchScore > 80 ? 'Strong experience fit' : 'Partial experience match',
          ],
          recruiterOwnerUserId: recruiter.id,
          submittedAt: pc.stage !== CandidateStage.SHORTLISTED ? new Date() : null,
          lastStageChangeAt: new Date(),
        },
      })
    )
  )

  console.log('Created project candidates')

  // Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      { entityType: 'User', entityId: admin.id, action: 'CREATED', performedByUserId: admin.id },
      { entityType: 'Customer', entityId: customers[0].id, action: 'CREATED', performedByUserId: sales.id },
      { entityType: 'Customer', entityId: customers[1].id, action: 'CREATED', performedByUserId: sales.id },
      { entityType: 'Customer', entityId: customers[2].id, action: 'CREATED', performedByUserId: clientManager.id },
      { entityType: 'Project', entityId: projects[0].id, action: 'CREATED', performedByUserId: sales.id },
      { entityType: 'Project', entityId: projects[0].id, action: 'STAGE_CHANGED', performedByUserId: recruiter.id, diff: { status: { old: 'INITIAL', new: 'SOURCING' } } },
    ],
  })

  console.log('Created activity logs')

  // Create Engineers
  const engineersData = [
    {
      fullName: 'David Chen',
      email: 'david.chen@naviteq.com',
      phone: '+972-50-600-1111',
      location: 'Tel Aviv',
      title: 'Senior Full Stack Developer',
      technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
      yearsExperience: 7,
      seniorityLevel: SeniorityLevel.SENIOR,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
    {
      fullName: 'Maria Rodriguez',
      email: 'maria.r@naviteq.com',
      phone: '+972-50-600-2222',
      location: 'Tel Aviv',
      title: 'DevOps Engineer',
      technologies: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'GCP', 'Python', 'Jenkins'],
      yearsExperience: 5,
      seniorityLevel: SeniorityLevel.SENIOR,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
    {
      fullName: 'Oren Levy',
      email: 'oren.l@naviteq.com',
      phone: '+972-50-600-3333',
      location: 'Herzliya',
      title: 'Backend Developer',
      technologies: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'Kafka'],
      yearsExperience: 4,
      seniorityLevel: SeniorityLevel.MID,
      employmentStatus: EmploymentStatus.BENCH,
    },
    {
      fullName: 'Anna Kowalski',
      email: 'anna.k@naviteq.com',
      phone: '+972-50-600-4444',
      location: 'Remote',
      title: 'React Native Developer',
      technologies: ['React Native', 'TypeScript', 'Redux', 'iOS', 'Android'],
      yearsExperience: 5,
      seniorityLevel: SeniorityLevel.SENIOR,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
    {
      fullName: 'Mikhail Petrov',
      email: 'mikhail.p@naviteq.com',
      phone: '+972-50-600-5555',
      location: 'Tel Aviv',
      title: 'Java Backend Developer',
      technologies: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'Kafka', 'Microservices'],
      yearsExperience: 8,
      seniorityLevel: SeniorityLevel.SENIOR,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
    {
      fullName: 'Yael Goldstein',
      email: 'yael.g@naviteq.com',
      phone: '+972-50-600-6666',
      location: 'Ramat Gan',
      title: 'Frontend Developer',
      technologies: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'GraphQL'],
      yearsExperience: 3,
      seniorityLevel: SeniorityLevel.MID,
      employmentStatus: EmploymentStatus.BENCH,
    },
    {
      fullName: 'James Wilson',
      email: 'james.w@naviteq.com',
      phone: '+972-50-600-7777',
      location: 'Tel Aviv',
      title: 'Tech Lead',
      technologies: ['React', 'Node.js', 'Python', 'AWS', 'Kubernetes', 'Architecture'],
      yearsExperience: 10,
      seniorityLevel: SeniorityLevel.LEAD,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
    {
      fullName: 'Sofia Martinez',
      email: 'sofia.m@naviteq.com',
      phone: '+972-50-600-8888',
      location: 'Herzliya',
      title: 'QA Automation Engineer',
      technologies: ['Selenium', 'Cypress', 'Python', 'JavaScript', 'Jenkins', 'TestRail'],
      yearsExperience: 4,
      seniorityLevel: SeniorityLevel.MID,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
    {
      fullName: 'Daniel Kim',
      email: 'daniel.k@naviteq.com',
      phone: '+972-50-600-9999',
      location: 'Tel Aviv',
      title: 'Data Engineer',
      technologies: ['Python', 'Spark', 'Airflow', 'AWS', 'Snowflake', 'dbt'],
      yearsExperience: 5,
      seniorityLevel: SeniorityLevel.SENIOR,
      employmentStatus: EmploymentStatus.BENCH,
    },
    {
      fullName: 'Rachel Green',
      email: 'rachel.gr@naviteq.com',
      phone: '+972-50-601-0000',
      location: 'Remote',
      title: 'Cloud Architect',
      technologies: ['AWS', 'GCP', 'Azure', 'Terraform', 'Kubernetes', 'Security'],
      yearsExperience: 9,
      seniorityLevel: SeniorityLevel.LEAD,
      employmentStatus: EmploymentStatus.ASSIGNED,
    },
  ]

  const engineers = await Promise.all(
    engineersData.map((data) =>
      prisma.engineer.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          location: data.location,
          title: data.title,
          technologies: data.technologies,
          yearsExperience: data.yearsExperience,
          seniorityLevel: data.seniorityLevel,
          employmentStatus: data.employmentStatus,
        },
      })
    )
  )

  console.log(`Created ${engineers.length} engineers`)

  // Create DevOps Projects (active delivery projects)
  const devOpsProjects = await Promise.all([
    prisma.project.create({
      data: {
        customerId: customers[0].id,
        title: 'Cloud Migration - Phase 2',
        description: 'Ongoing cloud migration project moving legacy systems to AWS. Currently in phase 2 focusing on data services.',
        technologies: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'PostgreSQL'],
        projectCategory: 'DEVOPS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: clientManager.id }, { userId: sales.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[0].id,
        title: 'Platform Development Team',
        description: 'Dedicated team building the next-gen platform features for TechCorp.',
        technologies: ['React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL'],
        projectCategory: 'DEVOPS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: clientManager.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[1].id,
        title: 'Payment Gateway Maintenance',
        description: 'Ongoing maintenance and feature development for the payment gateway system.',
        technologies: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Stripe API'],
        projectCategory: 'DEVOPS',
        devOpsStatus: DevOpsStatus.AT_RISK,
        priority: ProjectPriority.URGENT,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: sales.id }, { userId: clientManager.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[1].id,
        title: 'Mobile App Team',
        description: 'Dedicated mobile development team for the FinanceHub app.',
        technologies: ['React Native', 'TypeScript', 'Redux', 'Node.js'],
        projectCategory: 'DEVOPS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: clientManager.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[2].id,
        title: 'Healthcare Platform Support',
        description: 'Long-term support and development for the patient management system.',
        technologies: ['Java', 'Spring Boot', 'MySQL', 'Kafka', 'Docker'],
        projectCategory: 'DEVOPS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: clientManager.id }, { userId: recruiter.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[2].id,
        title: 'QA Automation Initiative',
        description: 'Building comprehensive test automation framework for HealthTech systems.',
        technologies: ['Selenium', 'Python', 'Jenkins', 'TestRail', 'Cypress'],
        projectCategory: 'DEVOPS',
        devOpsStatus: DevOpsStatus.BLOCKED,
        priority: ProjectPriority.LOW,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: recruiter.id }],
        },
      },
    }),
  ])

  console.log(`Created ${devOpsProjects.length} DevOps projects`)

  // Create Developers Projects (internal talent pools)
  const developersProjects = await Promise.all([
    prisma.project.create({
      data: {
        customerId: customers[0].id, // TechCorp sponsors this pool
        title: 'React/Node.js Developer Pool',
        description: 'Internal pool of full-stack developers specializing in React and Node.js, ready for quick deployment.',
        technologies: ['React', 'Node.js', 'TypeScript', 'AWS'],
        projectCategory: 'DEVELOPERS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: recruiter.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[1].id,
        title: 'Python Backend Specialists',
        description: 'Pool of Python developers with fintech and backend expertise.',
        technologies: ['Python', 'Django', 'FastAPI', 'PostgreSQL'],
        projectCategory: 'DEVELOPERS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: recruiter.id }, { userId: sales.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        customerId: customers[2].id,
        title: 'Healthcare Tech Experts',
        description: 'Specialized pool of developers with healthcare domain knowledge and compliance certifications.',
        technologies: ['Java', 'Spring Boot', 'Python', 'HL7', 'FHIR'],
        projectCategory: 'DEVELOPERS',
        devOpsStatus: DevOpsStatus.ACTIVE,
        priority: ProjectPriority.MEDIUM,
        status: ProjectStatus.CLOSED_WON,
        assignedUsers: {
          create: [{ userId: clientManager.id }],
        },
      },
    }),
  ])

  console.log(`Created ${developersProjects.length} Developers projects`)

  // Create Engineer Assignments (link engineers to DevOps projects)
  const engineerAssignments = await Promise.all([
    // Cloud Migration team
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[1].id, // Maria - DevOps
        projectId: devOpsProjects[0].id,
        customerId: customers[0].id,
        startDate: new Date('2024-01-15'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Leading infrastructure migration',
      },
    }),
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[9].id, // Rachel - Cloud Architect
        projectId: devOpsProjects[0].id,
        customerId: customers[0].id,
        startDate: new Date('2024-01-15'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Architecture oversight',
      },
    }),
    // Platform Development team
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[0].id, // David - Full Stack
        projectId: devOpsProjects[1].id,
        customerId: customers[0].id,
        startDate: new Date('2023-09-01'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Tech lead on platform team',
      },
    }),
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[6].id, // James - Tech Lead
        projectId: devOpsProjects[1].id,
        customerId: customers[0].id,
        startDate: new Date('2023-09-01'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Overall technical direction',
      },
    }),
    // Payment Gateway team
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[2].id, // Oren - Backend (will be reassigned, currently bench)
        projectId: devOpsProjects[2].id,
        customerId: customers[1].id,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-01'),
        status: AssignmentStatus.COMPLETED,
        notes: 'Completed 1-month engagement',
      },
    }),
    // Mobile App team
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[3].id, // Anna - React Native
        projectId: devOpsProjects[3].id,
        customerId: customers[1].id,
        startDate: new Date('2023-11-01'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Lead mobile developer',
      },
    }),
    // Healthcare Platform team
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[4].id, // Mikhail - Java
        projectId: devOpsProjects[4].id,
        customerId: customers[2].id,
        startDate: new Date('2023-06-01'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Core backend development',
      },
    }),
    // QA Automation
    prisma.engineerAssignment.create({
      data: {
        engineerId: engineers[7].id, // Sofia - QA
        projectId: devOpsProjects[5].id,
        customerId: customers[2].id,
        startDate: new Date('2024-01-01'),
        status: AssignmentStatus.ACTIVE,
        notes: 'Building test framework - blocked waiting for environment access',
      },
    }),
  ])

  console.log(`Created ${engineerAssignments.length} engineer assignments`)

  // Create some project updates for DevOps projects
  await prisma.projectUpdate.createMany({
    data: [
      {
        projectId: devOpsProjects[0].id,
        authorUserId: clientManager.id,
        content: 'Phase 2 kickoff completed. Database migration planning in progress.',
        visibility: 'INTERNAL',
        tags: ['milestone', 'planning'],
      },
      {
        projectId: devOpsProjects[0].id,
        authorUserId: clientManager.id,
        content: 'Successfully migrated 3 microservices to AWS EKS this week. Performance metrics looking good.',
        visibility: 'CUSTOMER_FACING',
        tags: ['progress', 'aws'],
      },
      {
        projectId: devOpsProjects[2].id,
        authorUserId: sales.id,
        content: 'Client raised concerns about response times during peak hours. Need to investigate.',
        visibility: 'INTERNAL',
        tags: ['issue', 'performance'],
      },
      {
        projectId: devOpsProjects[2].id,
        authorUserId: clientManager.id,
        content: 'Marking project as at-risk due to performance issues and upcoming deadline.',
        visibility: 'INTERNAL',
        tags: ['risk', 'escalation'],
      },
      {
        projectId: devOpsProjects[5].id,
        authorUserId: recruiter.id,
        content: 'Project blocked - waiting for client to provision test environment access.',
        visibility: 'INTERNAL',
        tags: ['blocked', 'waiting'],
      },
    ],
  })

  console.log('Created project updates for DevOps projects')

  console.log('Seed completed successfully!')
  console.log('\n=== Demo Credentials ===')
  console.log('Admin:          admin@naviteq.com / admin123')
  console.log('Sales:          sarah@naviteq.com / admin123')
  console.log('Recruiter:      rachel@naviteq.com / admin123')
  console.log('Client Manager: michael@naviteq.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
