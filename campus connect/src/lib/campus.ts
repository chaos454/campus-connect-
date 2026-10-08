import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const INTERESTS = [
  "AI/ML", "Web Dev", "Open Source", "Hackathons", "Startups", "Design", "Robotics", "Research",
  "Finance", "Business", "Debate", "Music", "Photography", "Art", "Writing", "Reading", "Movies",
  "Sports", "Fitness", "Travel", "Climate", "Astronomy", "Chess", "Gaming",
];

export const LOOKING_FOR = [
  "Friends", "Study group", "Hackathon team", "Project collaborators", "Club members", "Mentorship", "Co-founder",
];

export const RELATIONSHIP = ["Single", "In a relationship", "It's complicated", "Prefer not to say"];

export type Student = {
  id: string;
  full_name: string;
  username: string;
  branch: string | null;
  year: number | null;
  bio: string | null;
  interests: string[];
  looking_for: string[];
  relationship_status: string | null;
  connection_status: string | null;
  is_requester: boolean | null;
  shared?: number;
};

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, colleges(name, short_name, city)")
      .eq("id", auth.user.id)
      .maybeSingle();
    return { user: auth.user, profile };
  },
});

export const studentsQuery = (search: string) =>
  queryOptions({
    queryKey: ["students", search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("campus_students", { ...(search ? { _search: search } : {}), _limit: 60 });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

export const studentQuery = (username: string) =>
  queryOptions({
    queryKey: ["student", username],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("campus_student", { _username: username });
      if (error) throw error;
      return (data?.[0] ?? null) as Student | null;
    },
  });

export const connectionsQuery = queryOptions({
  queryKey: ["connections"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("my_connections");
    if (error) throw error;
    return data ?? [];
  },
});

/** Built-in directory of Indian institutions (works even before DB migrations). */
export const INDIA_COLLEGES: { name: string; short_name: string; domain: string }[] = [
  // IITs
  { name: "Indian Institute of Technology Bombay", short_name: "IIT Bombay", domain: "iitb.ac.in" },
  { name: "Indian Institute of Technology Delhi", short_name: "IIT Delhi", domain: "iitd.ac.in" },
  { name: "Indian Institute of Technology Madras", short_name: "IIT Madras", domain: "iitm.ac.in" },
  { name: "Indian Institute of Technology Kanpur", short_name: "IIT Kanpur", domain: "iitk.ac.in" },
  { name: "Indian Institute of Technology Kharagpur", short_name: "IIT Kharagpur", domain: "iitkgp.ac.in" },
  { name: "Indian Institute of Technology Roorkee", short_name: "IIT Roorkee", domain: "iitr.ac.in" },
  { name: "Indian Institute of Technology Guwahati", short_name: "IIT Guwahati", domain: "iitg.ac.in" },
  { name: "Indian Institute of Technology Hyderabad", short_name: "IIT Hyderabad", domain: "iith.ac.in" },
  { name: "Indian Institute of Technology Indore", short_name: "IIT Indore", domain: "iiti.ac.in" },
  { name: "Indian Institute of Technology BHU", short_name: "IIT BHU", domain: "iitbhu.ac.in" },
  { name: "Indian Institute of Technology Ropar", short_name: "IIT Ropar", domain: "iitrpr.ac.in" },
  { name: "Indian Institute of Technology Mandi", short_name: "IIT Mandi", domain: "iitmandi.ac.in" },
  { name: "Indian Institute of Technology Gandhinagar", short_name: "IIT Gandhinagar", domain: "iitgn.ac.in" },
  { name: "Indian Institute of Technology Jodhpur", short_name: "IIT Jodhpur", domain: "iitj.ac.in" },
  { name: "Indian Institute of Technology Patna", short_name: "IIT Patna", domain: "iitp.ac.in" },
  { name: "Indian Institute of Technology Bhubaneswar", short_name: "IIT Bhubaneswar", domain: "iitbbs.ac.in" },
  { name: "Indian Institute of Technology Tirupati", short_name: "IIT Tirupati", domain: "iittp.ac.in" },
  { name: "Indian Institute of Technology Palakkad", short_name: "IIT Palakkad", domain: "iitpkd.ac.in" },
  { name: "Indian Institute of Technology Dhanbad", short_name: "IIT ISM Dhanbad", domain: "iitism.ac.in" },
  { name: "Indian Institute of Technology Jammu", short_name: "IIT Jammu", domain: "iitjammu.ac.in" },
  { name: "Indian Institute of Technology Bhilai", short_name: "IIT Bhilai", domain: "iitbhilai.ac.in" },
  { name: "Indian Institute of Technology Goa", short_name: "IIT Goa", domain: "iitgoa.ac.in" },
  { name: "Indian Institute of Technology Dharwad", short_name: "IIT Dharwad", domain: "iitdh.ac.in" },
  // NITs
  { name: "National Institute of Technology Trichy", short_name: "NIT Trichy", domain: "nitt.edu" },
  { name: "National Institute of Technology Karnataka", short_name: "NITK Surathkal", domain: "nitk.edu.in" },
  { name: "National Institute of Technology Warangal", short_name: "NIT Warangal", domain: "nitw.ac.in" },
  { name: "National Institute of Technology Calicut", short_name: "NIT Calicut", domain: "nitc.ac.in" },
  { name: "National Institute of Technology Rourkela", short_name: "NIT Rourkela", domain: "nitrkl.ac.in" },
  { name: "National Institute of Technology Durgapur", short_name: "NIT Durgapur", domain: "nitdgp.ac.in" },
  { name: "National Institute of Technology Kurukshetra", short_name: "NIT Kurukshetra", domain: "nitkkr.ac.in" },
  { name: "Malaviya National Institute of Technology", short_name: "MNIT Jaipur", domain: "mnit.ac.in" },
  { name: "Motilal Nehru National Institute of Technology", short_name: "MNNIT Allahabad", domain: "mnnit.ac.in" },
  { name: "Maulana Azad National Institute of Technology", short_name: "MANIT Bhopal", domain: "manit.ac.in" },
  { name: "National Institute of Technology Jalandhar", short_name: "NIT Jalandhar", domain: "nitj.ac.in" },
  { name: "National Institute of Technology Hamirpur", short_name: "NIT Hamirpur", domain: "nith.ac.in" },
  { name: "National Institute of Technology Jamshedpur", short_name: "NIT Jamshedpur", domain: "nitjsr.ac.in" },
  { name: "National Institute of Technology Patna", short_name: "NIT Patna", domain: "nitp.ac.in" },
  { name: "National Institute of Technology Raipur", short_name: "NIT Raipur", domain: "nitrr.ac.in" },
  { name: "National Institute of Technology Silchar", short_name: "NIT Silchar", domain: "nits.ac.in" },
  { name: "National Institute of Technology Srinagar", short_name: "NIT Srinagar", domain: "nitsri.ac.in" },
  { name: "National Institute of Technology Delhi", short_name: "NIT Delhi", domain: "nitdelhi.ac.in" },
  { name: "Sardar Vallabhbhai National Institute of Technology", short_name: "SVNIT", domain: "svnit.ac.in" },
  { name: "Visvesvaraya National Institute of Technology", short_name: "VNIT", domain: "vnit.ac.in" },
  // IIITs
  { name: "International Institute of Information Technology Hyderabad", short_name: "IIIT Hyderabad", domain: "iiit.ac.in" },
  { name: "Indian Institute of Information Technology Allahabad", short_name: "IIIT Allahabad", domain: "iiita.ac.in" },
  { name: "Indian Institute of Information Technology Delhi", short_name: "IIIT Delhi", domain: "iiitd.ac.in" },
  { name: "Indian Institute of Information Technology Bangalore", short_name: "IIIT Bangalore", domain: "iiitb.ac.in" },
  { name: "ABV-IIITM Gwalior", short_name: "IIITM Gwalior", domain: "iiitm.ac.in" },
  { name: "IIITDM Kancheepuram", short_name: "IIITDM Kancheepuram", domain: "iiitdm.ac.in" },
  { name: "IIITDM Jabalpur", short_name: "IIITDM Jabalpur", domain: "iiitdmj.ac.in" },
  { name: "Indian Institute of Information Technology Guwahati", short_name: "IIIT Guwahati", domain: "iiitg.ac.in" },
  { name: "Indian Institute of Information Technology Lucknow", short_name: "IIIT Lucknow", domain: "iiitl.ac.in" },
  { name: "Indian Institute of Information Technology Pune", short_name: "IIIT Pune", domain: "iiitp.ac.in" },
  { name: "Indian Institute of Information Technology Sri City", short_name: "IIIT Sri City", domain: "iiits.ac.in" },
  // IISc / IISER / ISI
  { name: "Indian Institute of Science", short_name: "IISc Bangalore", domain: "iisc.ac.in" },
  { name: "IISER Pune", short_name: "IISER Pune", domain: "iiserpune.ac.in" },
  { name: "IISER Kolkata", short_name: "IISER Kolkata", domain: "iiserkol.ac.in" },
  { name: "IISER Mohali", short_name: "IISER Mohali", domain: "iisermohali.ac.in" },
  { name: "IISER Bhopal", short_name: "IISER Bhopal", domain: "iiserb.ac.in" },
  { name: "IISER Thiruvananthapuram", short_name: "IISER TVM", domain: "iisertvm.ac.in" },
  { name: "NISER Bhubaneswar", short_name: "NISER", domain: "niser.ac.in" },
  { name: "Indian Statistical Institute", short_name: "ISI Kolkata", domain: "isical.ac.in" },
  // Universities
  { name: "University of Delhi", short_name: "DU", domain: "du.ac.in" },
  { name: "Jawaharlal Nehru University", short_name: "JNU", domain: "jnu.ac.in" },
  { name: "Banaras Hindu University", short_name: "BHU", domain: "bhu.ac.in" },
  { name: "University of Hyderabad", short_name: "UoH", domain: "uohyd.ac.in" },
  { name: "University of Mumbai", short_name: "Mumbai University", domain: "mu.ac.in" },
  { name: "University of Calcutta", short_name: "Calcutta University", domain: "caluniv.ac.in" },
  { name: "Anna University", short_name: "Anna University", domain: "annauniv.edu" },
  { name: "Aligarh Muslim University", short_name: "AMU", domain: "amu.ac.in" },
  { name: "Jamia Millia Islamia", short_name: "JMI", domain: "jmi.ac.in" },
  { name: "Panjab University", short_name: "PU", domain: "puchd.ac.in" },
  { name: "Osmania University", short_name: "OU", domain: "osmania.ac.in" },
  { name: "Savitribai Phule Pune University", short_name: "SPPU", domain: "unipune.ac.in" },
  { name: "Jadavpur University", short_name: "JU", domain: "jaduniv.edu.in" },
  { name: "Guru Gobind Singh Indraprastha University", short_name: "IPU", domain: "ipu.ac.in" },
  { name: "JNTU Hyderabad", short_name: "JNTUH", domain: "jntuh.ac.in" },
  { name: "Visvesvaraya Technological University", short_name: "VTU", domain: "vtu.ac.in" },
  { name: "Cochin University of Science and Technology", short_name: "CUSAT", domain: "cusat.ac.in" },
  // Private / other
  { name: "BITS Pilani", short_name: "BITS Pilani", domain: "bits-pilani.ac.in" },
  { name: "BITS Pilani", short_name: "BITS", domain: "pilani.bits-pilani.ac.in" },
  { name: "BITS Goa", short_name: "BITS Goa", domain: "goa.bits-pilani.ac.in" },
  { name: "BITS Hyderabad", short_name: "BITS Hyderabad", domain: "hyderabad.bits-pilani.ac.in" },
  { name: "BIT Mesra", short_name: "BIT Mesra", domain: "bitmesra.ac.in" },
  { name: "Vellore Institute of Technology", short_name: "VIT", domain: "vit.ac.in" },
  { name: "SRM Institute of Science and Technology", short_name: "SRM", domain: "srmist.edu.in" },
  { name: "Manipal Academy of Higher Education", short_name: "Manipal", domain: "manipal.edu" },
  { name: "Amrita Vishwa Vidyapeetham", short_name: "Amrita", domain: "amrita.edu" },
  { name: "Thapar Institute", short_name: "Thapar", domain: "thapar.edu" },
  { name: "Delhi Technological University", short_name: "DTU", domain: "dtu.ac.in" },
  { name: "Netaji Subhas University of Technology", short_name: "NSUT", domain: "nsut.ac.in" },
  { name: "DAIICT Gandhinagar", short_name: "DAIICT", domain: "daiict.ac.in" },
  { name: "LNMIIT Jaipur", short_name: "LNMIIT", domain: "lnmiit.ac.in" },
  { name: "PES University", short_name: "PES", domain: "pes.edu" },
  { name: "RV College of Engineering", short_name: "RVCE", domain: "rvce.edu.in" },
  { name: "BMS College of Engineering", short_name: "BMSCE", domain: "bmsce.ac.in" },
  { name: "College of Engineering Pune", short_name: "COEP", domain: "coep.org.in" },
  { name: "VJTI Mumbai", short_name: "VJTI", domain: "vjti.ac.in" },
  { name: "PSG College of Technology", short_name: "PSG Tech", domain: "psgtech.ac.in" },
  { name: "KIIT Bhubaneswar", short_name: "KIIT", domain: "kiit.ac.in" },
  { name: "Amity University", short_name: "Amity", domain: "amity.edu" },
  { name: "Lovely Professional University", short_name: "LPU", domain: "lpu.co.in" },
  { name: "Chandigarh University", short_name: "CU", domain: "cuchd.in" },
  { name: "Ashoka University", short_name: "Ashoka", domain: "ashoka.edu.in" },
  { name: "Shiv Nadar University", short_name: "SNU", domain: "snu.edu.in" },
  { name: "Symbiosis International University", short_name: "SIU", domain: "siu.edu.in" },
  { name: "Christ University", short_name: "Christ", domain: "christuniversity.in" },
  { name: "IIM Ahmedabad", short_name: "IIM Ahmedabad", domain: "iima.ac.in" },
  { name: "IIM Bangalore", short_name: "IIM Bangalore", domain: "iimb.ac.in" },
  { name: "IIM Calcutta", short_name: "IIM Calcutta", domain: "iimcal.ac.in" },
  { name: "IIM Lucknow", short_name: "IIM Lucknow", domain: "iiml.ac.in" },
  { name: "IIM Indore", short_name: "IIM Indore", domain: "iimidr.ac.in" },
  { name: "IIM Kozhikode", short_name: "IIM Kozhikode", domain: "iimk.ac.in" },
  { name: "AIIMS Delhi", short_name: "AIIMS Delhi", domain: "aiims.edu" },
  { name: "AIIMS", short_name: "AIIMS", domain: "aiims.ac.in" },
  { name: "TIFR Mumbai", short_name: "TIFR", domain: "tifr.res.in" },
  { name: "TISS Mumbai", short_name: "TISS", domain: "tiss.edu" },

  // —— Private / deemed universities (major campuses) ——
  // Multi-campus groups
  { name: "Amity University Noida", short_name: "Amity Noida", domain: "amity.edu" },
  { name: "Amity University", short_name: "Amity", domain: "student.amity.edu" },
  { name: "Lovely Professional University", short_name: "LPU", domain: "lpu.co.in" },
  { name: "Lovely Professional University", short_name: "LPU", domain: "lpu.in" },
  { name: "Chandigarh University", short_name: "CU", domain: "cuchd.in" },
  { name: "Chandigarh University", short_name: "CU", domain: "university.cuchd.in" },
  { name: "Sharda University", short_name: "Sharda", domain: "sharda.ac.in" },
  { name: "Galgotias University", short_name: "Galgotias", domain: "galgotiasuniversity.edu.in" },
  { name: "GLA University", short_name: "GLA", domain: "gla.ac.in" },
  { name: "Bennett University", short_name: "Bennett", domain: "bennett.edu.in" },
  { name: "Shiv Nadar University", short_name: "SNU", domain: "snu.edu.in" },
  { name: "Ashoka University", short_name: "Ashoka", domain: "ashoka.edu.in" },
  { name: "O.P. Jindal Global University", short_name: "JGU", domain: "jgu.edu.in" },
  { name: "O.P. Jindal University Raigarh", short_name: "OPJU", domain: "opju.ac.in" },
  { name: "UPES Dehradun", short_name: "UPES", domain: "ddn.upes.ac.in" },
  { name: "UPES Dehradun", short_name: "UPES", domain: "stu.upes.ac.in" },
  { name: "UPES Dehradun", short_name: "UPES", domain: "upes.ac.in" },
  { name: "Graphic Era University", short_name: "GEU", domain: "geu.ac.in" },
  { name: "Graphic Era Hill University", short_name: "GEHU", domain: "gehu.ac.in" },
  { name: "DIT University", short_name: "DIT", domain: "dituniversity.edu.in" },
  { name: "Uttaranchal University", short_name: "UU", domain: "uttaranchaluniversity.ac.in" },
  { name: "Swami Rama Himalayan University", short_name: "SRHU", domain: "srhu.edu.in" },
  { name: "Dev Sanskriti Vishwavidyalaya", short_name: "DSVV", domain: "dsvv.ac.in" },
  { name: "Quantum University", short_name: "Quantum", domain: "quantumuniversity.edu.in" },
  { name: "IMS Unison University", short_name: "IMS Unison", domain: "iuu.ac" },
  { name: "ICFAI University Dehradun", short_name: "ICFAI", domain: "iudehradun.edu.in" },
  { name: "Shoolini University", short_name: "Shoolini", domain: "shooliniuniversity.com" },
  { name: "Chitkara University Punjab", short_name: "Chitkara", domain: "chitkara.edu.in" },
  { name: "Chitkara University Himachal", short_name: "Chitkara HP", domain: "chitkarauniversity.edu.in" },
  { name: "Rayat Bahra University", short_name: "Rayat Bahra", domain: "rayatbahrauniversity.edu.in" },
  { name: "RIMT University", short_name: "RIMT", domain: "rimt.ac.in" },
  { name: "Desh Bhagat University", short_name: "DBU", domain: "deshbhagatuniversity.in" },
  { name: "CT University", short_name: "CTU", domain: "ctuniversity.in" },
  { name: "DAV University", short_name: "DAV University", domain: "davuniversity.org" },
  { name: "Apeejay Stya University", short_name: "Apeejay Stya", domain: "asu.apeejay.edu" },
  { name: "GD Goenka University", short_name: "GD Goenka", domain: "gdgoenka.ac.in" },
  { name: "K.R. Mangalam University", short_name: "KRMU", domain: "krmangalam.edu.in" },
  { name: "Sushant University", short_name: "Sushant", domain: "sushantuniversity.edu.in" },
  { name: "Ansal University", short_name: "Ansal", domain: "ansaluniversity.edu.in" },
  { name: "NCU Gurugram", short_name: "NCU", domain: "ncuindia.edu" },
  { name: "BML Munjal University", short_name: "BMU", domain: "bmu.edu.in" },
  { name: "Manav Rachna University", short_name: "MRU", domain: "mru.edu.in" },
  { name: "Manav Rachna International Institute", short_name: "MRIIRS", domain: "mrei.ac.in" },
  { name: "Lingaya's Vidyapeeth", short_name: "Lingaya", domain: "lingayasvidyapeeth.edu.in" },
  { name: "Starex University", short_name: "Starex", domain: "starexuniversity.com" },
  { name: "World University of Design", short_name: "WUD", domain: "wud.ac.in" },
  { name: "IILM University", short_name: "IILM", domain: "iilm.edu" },
  { name: "JECRC University", short_name: "JECRC", domain: "jecrcu.edu.in" },
  { name: "Jaipur National University", short_name: "JNU Jaipur", domain: "jnujaipur.ac.in" },
  { name: "Manipal University Jaipur", short_name: "MUJ", domain: "jaipur.manipal.edu" },
  { name: "Amity University Rajasthan", short_name: "Amity Jaipur", domain: "jpr.amity.edu" },
  { name: "Poornima University", short_name: "Poornima", domain: "poornima.edu.in" },
  { name: "JK Lakshmipat University", short_name: "JKLU", domain: "jklu.edu.in" },
  { name: "IIS University Jaipur", short_name: "IISU", domain: "iisuniv.ac.in" },
  { name: "NIMS University", short_name: "NIMS", domain: "nimsuniversity.org" },
  { name: "Suresh Gyan Vihar University", short_name: "SGVU", domain: "gyanvihar.org" },
  { name: "Maharishi Arvind University", short_name: "MAU", domain: "maujpr.ac.in" },
  { name: "Vivekananda Global University", short_name: "VGU", domain: "vgu.ac.in" },
  { name: "ICFAI University Jaipur", short_name: "ICFAI Jaipur", domain: "iujaipur.edu.in" },
  { name: "Mody University", short_name: "Mody", domain: "modyuniversity.ac.in" },
  { name: "Bhagwant University", short_name: "Bhagwant", domain: "bhagwantuniversity.ac.in" },
  { name: "Sunrise University", short_name: "Sunrise", domain: "sunriseuniversity.in" },
  { name: "Pacific University Udaipur", short_name: "Pacific", domain: "pacific-university.ac.in" },
  { name: "Sangam University", short_name: "Sangam", domain: "sangamuniversity.ac.in" },
  { name: "MEWAR University", short_name: "Mewar", domain: "mewaruniversity.org" },
  { name: "Sir Padampat Singhania University", short_name: "SPSU", domain: "spsu.ac.in" },
  { name: "NIIT University", short_name: "NIIT University", domain: "niituniversity.in" },
  { name: "Parul University", short_name: "Parul", domain: "paruluniversity.ac.in" },
  { name: "Nirma University", short_name: "Nirma", domain: "nirmauni.ac.in" },
  { name: "Ahmedabad University", short_name: "Ahmedabad Univ", domain: "ahduni.edu.in" },
  { name: "Pandit Deendayal Energy University", short_name: "PDEU", domain: "pdpu.ac.in" },
  { name: "GSFC University", short_name: "GSFCU", domain: "gsfcuniversity.ac.in" },
  { name: "Indus University", short_name: "Indus", domain: "indusuni.ac.in" },
  { name: "Karnavati University", short_name: "Karnavati", domain: "karnavatiuniversity.edu.in" },
  { name: "Ganpat University", short_name: "Ganpat", domain: "ganpatuniversity.ac.in" },
  { name: "Charusat University", short_name: "CHARUSAT", domain: "charusat.ac.in" },
  { name: "Uka Tarsadia University", short_name: "UTU", domain: "utu.ac.in" },
  { name: "Marwadi University", short_name: "Marwadi", domain: "marwadieducation.edu.in" },
  { name: "RK University", short_name: "RKU", domain: "rku.ac.in" },
  { name: "Atmiya University", short_name: "Atmiya", domain: "atmiyauni.ac.in" },
  { name: "ITM Vocational University", short_name: "ITM VU", domain: "itm.ac.in" },
  { name: "Silver Oak University", short_name: "Silver Oak", domain: "silveroakuni.ac.in" },
  { name: "TeamLease Skills University", short_name: "TLSU", domain: "teamleaseuniversity.ac.in" },
  { name: "MIT World Peace University", short_name: "MIT-WPU", domain: "mitwpu.edu.in" },
  { name: "MIT ADT University", short_name: "MIT ADT", domain: "mituniversity.edu.in" },
  { name: "Symbiosis International University", short_name: "SIU", domain: "siu.edu.in" },
  { name: "Symbiosis Skills University", short_name: "SSU", domain: "ssu.edu.in" },
  { name: "FLAME University", short_name: "FLAME", domain: "flame.edu.in" },
  { name: "Ajeenkya DY Patil University", short_name: "ADYPU", domain: "adypu.edu.in" },
  { name: "Vishwakarma University", short_name: "VU Pune", domain: "vupune.ac.in" },
  { name: "Dr. D.Y. Patil Vidyapeeth", short_name: "DPU", domain: "dpu.edu.in" },
  { name: "Bharati Vidyapeeth", short_name: "BVDU", domain: "bharatividyapeeth.edu" },
  { name: "NMIMS University", short_name: "NMIMS", domain: "nmims.edu" },
  { name: "Somaiya Vidyavihar University", short_name: "Somaiya", domain: "somaiya.edu" },
  { name: "D.Y. Patil University Navi Mumbai", short_name: "DYPU", domain: "dypatil.edu" },
  { name: "Amity University Mumbai", short_name: "Amity Mumbai", domain: "mum.amity.edu" },
  { name: "Sandip University", short_name: "Sandip", domain: "sandipuniversity.edu.in" },
  { name: "MIT Art Design Technology University", short_name: "MIT ADT", domain: "mituniversity.ac.in" },
  { name: "Spicer Adventist University", short_name: "Spicer", domain: "spiceradventistuniversity.ac.in" },
  { name: "Christ University", short_name: "Christ", domain: "christuniversity.in" },
  { name: "Jain University", short_name: "Jain", domain: "jainuniversity.ac.in" },
  { name: "REVA University", short_name: "REVA", domain: "reva.edu.in" },
  { name: "Presidency University Bangalore", short_name: "Presidency BLR", domain: "presidencyuniversity.in" },
  { name: "CMR University", short_name: "CMR", domain: "cmr.edu.in" },
  { name: "Dayananda Sagar University", short_name: "DSU", domain: "dsu.edu.in" },
  { name: "PES University", short_name: "PES", domain: "pes.edu" },
  { name: "Alliance University", short_name: "Alliance", domain: "alliance.edu.in" },
  { name: "Azim Premji University", short_name: "APU", domain: "azimpremjiuniversity.edu.in" },
  { name: "Azim Premji University", short_name: "APU", domain: "apu.edu.in" },
  { name: "MS Ramaiah University", short_name: "MSRIT Univ", domain: "msruas.ac.in" },
  { name: "Garden City University", short_name: "GCU", domain: "gardencity.university" },
  { name: "Kristu Jayanti", short_name: "Kristu Jayanti", domain: "kristujayanti.edu.in" },
  { name: "St Joseph's University Bangalore", short_name: "SJU", domain: "sju.edu.in" },
  { name: "Yenepoya University", short_name: "Yenepoya", domain: "yenepoya.edu.in" },
  { name: "Nitte University", short_name: "Nitte", domain: "nitte.edu.in" },
  { name: "KLE Technological University", short_name: "KLE Tech", domain: "kletech.ac.in" },
  { name: "KLE Academy of Higher Education", short_name: "KAHER", domain: "kledeemeduniversity.edu.in" },
  { name: "JSS Academy of Higher Education", short_name: "JSS AHER", domain: "jssuni.edu.in" },
  { name: "Sri Siddhartha Academy of Higher Education", short_name: "SSAHE", domain: "sahe.in" },
  { name: "Srinivas University", short_name: "Srinivas", domain: "srinivasuniversity.edu.in" },
  { name: "Adichunchanagiri University", short_name: "ACU", domain: "acu.edu.in" },
  { name: "CMR University", short_name: "CMRU", domain: "cmr.ac.in" },
  { name: "Rai Technology University", short_name: "RTU", domain: "raitechuniversity.in" },
  { name: "S-VYASA University", short_name: "S-VYASA", domain: "svyasa.edu.in" },
  { name: "Manipal Academy of Higher Education", short_name: "MAHE", domain: "manipal.edu" },
  { name: "Manipal University", short_name: "Manipal", domain: "learner.manipal.edu" },
  { name: "Amrita Vishwa Vidyapeetham", short_name: "Amrita", domain: "amrita.edu" },
  { name: "VIT Vellore", short_name: "VIT", domain: "vit.ac.in" },
  { name: "VIT Chennai", short_name: "VIT Chennai", domain: "vitstudent.ac.in" },
  { name: "VIT Bhopal", short_name: "VIT Bhopal", domain: "vitbhopal.ac.in" },
  { name: "VIT AP University", short_name: "VIT AP", domain: "vitap.ac.in" },
  { name: "SRM Institute of Science and Technology", short_name: "SRMIST", domain: "srmist.edu.in" },
  { name: "SRM University AP", short_name: "SRM AP", domain: "srmap.edu.in" },
  { name: "SRM University Delhi-NCR Sonepat", short_name: "SRM Sonepat", domain: "srmuniversity.ac.in" },
  { name: "Sathyabama Institute of Science and Technology", short_name: "Sathyabama", domain: "sathyabama.ac.in" },
  { name: "Hindustan Institute of Technology and Science", short_name: "HITS", domain: "hindustanuniv.ac.in" },
  { name: "B.S. Abdur Rahman Crescent Institute", short_name: "Crescent", domain: "crescent.education" },
  { name: "Vel Tech Rangarajan Dr.Sagunthala R&D Institute", short_name: "Vel Tech", domain: "veltech.edu.in" },
  { name: "Saveetha Institute of Medical and Technical Sciences", short_name: "SIMATS", domain: "saveetha.com" },
  { name: "Dr. M.G.R. Educational and Research Institute", short_name: "Dr MGR", domain: "drmgrdu.ac.in" },
  { name: "St. Peter's Institute of Higher Education", short_name: "SPIHER", domain: "stpetersuniversity.org" },
  { name: "Bharath Institute of Higher Education", short_name: "BIHER", domain: "bharathuniv.ac.in" },
  { name: "Periyar Maniammai Institute", short_name: "PMIST", domain: "pmu.edu" },
  { name: "Karunya Institute of Technology", short_name: "Karunya", domain: "karunya.edu" },
  { name: "Kalasalingam Academy of Research and Education", short_name: "KARE", domain: "klu.ac.in" },
  { name: "Noorul Islam Centre for Higher Education", short_name: "NICHE", domain: "niuniv.com" },
  { name: "Avinashilingam Institute", short_name: "Avinashilingam", domain: "avinuty.ac.in" },
  { name: "Sri Ramachandra Institute", short_name: "SRIHER", domain: "sriramachandra.edu.in" },
  { name: "Meenakshi Academy of Higher Education", short_name: "MAHER", domain: "maher.ac.in" },
  { name: "Chettinad Academy of Research and Education", short_name: "CARE", domain: "chettinadhealthcity.com" },
  { name: "Vinayaka Mission's Research Foundation", short_name: "VMRF", domain: "vinayakamission.com" },
  { name: "PRIST University", short_name: "PRIST", domain: "prist.ac.in" },
  { name: "KL University", short_name: "KL University", domain: "kluniversity.in" },
  { name: "GITAM University", short_name: "GITAM", domain: "gitam.edu" },
  { name: "GITAM University", short_name: "GITAM", domain: "gitam.in" },
  { name: "Centurion University", short_name: "CUTM", domain: "cutm.ac.in" },
  { name: "Vignan's Foundation", short_name: "VFSTR", domain: "vignan.ac.in" },
  { name: "ICFAI Foundation for Higher Education", short_name: "IFHE", domain: "ifheindia.org" },
  { name: "Woxsen University", short_name: "Woxsen", domain: "woxsen.edu.in" },
  { name: "Mahindra University", short_name: "Mahindra Univ", domain: "mahindrauniversity.edu.in" },
  { name: "Anurag University", short_name: "Anurag", domain: "anurag.edu.in" },
  { name: "Malla Reddy University", short_name: "MRU Hyd", domain: "mallareddyuniversity.ac.in" },
  { name: "Sreenidhi University", short_name: "Sreenidhi", domain: "sreenidhiuniversity.edu.in" },
  { name: "Krea University", short_name: "Krea", domain: "krea.edu.in" },
  { name: "SR University", short_name: "SRU", domain: "sru.edu.in" },
  { name: "Aditya University", short_name: "Aditya", domain: "adityauniversity.in" },
  { name: "KIIT University", short_name: "KIIT", domain: "kiit.ac.in" },
  { name: "SOA University", short_name: "SOA", domain: "soa.ac.in" },
  { name: "Centurion University Odisha", short_name: "CUTM Odisha", domain: "cutm.ac.in" },
  { name: "XIM University", short_name: "XIM", domain: "xim.edu.in" },
  { name: "Sri Sri University", short_name: "SSU Odisha", domain: "srisriuniversity.edu.in" },
  { name: "ASBM University", short_name: "ASBM", domain: "asbm.ac.in" },
  { name: "C.V. Raman Global University", short_name: "CVRGU", domain: "cgu-odisha.ac.in" },
  { name: "Birla Global University", short_name: "BGU", domain: "bgu.ac.in" },
  { name: "ICFAI University Jharkhand", short_name: "ICFAI JKD", domain: "iujharkhand.edu.in" },
  { name: "Arka Jain University", short_name: "Arka Jain", domain: "arkajainuniversity.ac.in" },
  { name: "Usha Martin University", short_name: "UMU", domain: "ushamartinuniversity.com" },
  { name: "Sai Nath University", short_name: "Sai Nath", domain: "sainathuniversity.com" },
  { name: "YBN University", short_name: "YBN", domain: "ybnu.ac.in" },
  { name: "Amity University Ranchi", short_name: "Amity Ranchi", domain: "rnc.amity.edu" },
  { name: "Capital University Jharkhand", short_name: "Capital Univ", domain: "capitaluniversity.ac.in" },
  { name: "RKDF University", short_name: "RKDF", domain: "rkdf.ac.in" },
  { name: "LNCT University", short_name: "LNCTU", domain: "lnctu.ac.in" },
  { name: "Rabindranath Tagore University", short_name: "RNTU", domain: "rntu.ac.in" },
  { name: "ITM University Gwalior", short_name: "ITM Gwalior", domain: "itmuniversity.ac.in" },
  { name: "Amity University Gwalior", short_name: "Amity Gwalior", domain: "gwa.amity.edu" },
  { name: "Jagran Lakecity University", short_name: "JLU", domain: "jlu.edu.in" },
  { name: "SAGE University Indore", short_name: "SAGE", domain: "sageuniversity.in" },
  { name: "Medi-Caps University", short_name: "Medi-Caps", domain: "medicaps.ac.in" },
  { name: "Oriental University", short_name: "Oriental", domain: "orientaluniversity.in" },
  { name: "AKS University", short_name: "AKS", domain: "aksuniversity.ac.in" },
  { name: "Dr. C.V. Raman University", short_name: "CVRU", domain: "cvru.ac.in" },
  { name: "Amity University Raipur", short_name: "Amity Raipur", domain: "rpr.amity.edu" },
  { name: "MATS University", short_name: "MATS", domain: "matsuniversity.ac.in" },
  { name: "Kalinga University Raipur", short_name: "Kalinga Raipur", domain: "kalingauniversity.ac.in" },
  { name: "ISBM University", short_name: "ISBM", domain: "isbmuniversity.edu.in" },
  { name: "AAFT University", short_name: "AAFT", domain: "aaft.edu.in" },
  { name: "ICFAI University Raipur", short_name: "ICFAI CG", domain: "iuraipur.edu.in" },
  { name: "Adamas University", short_name: "Adamas", domain: "adamasuniversity.ac.in" },
  { name: "Brainware University", short_name: "Brainware", domain: "brainwareuniversity.ac.in" },
  { name: "Amity University Kolkata", short_name: "Amity Kolkata", domain: "kol.amity.edu" },
  { name: "Seacom Skills University", short_name: "Seacom", domain: "seacomskillsuniversity.org" },
  { name: "JIS University", short_name: "JIS", domain: "jisuniversity.ac.in" },
  { name: "Techno India University", short_name: "TIU", domain: "technoindiauniversity.ac.in" },
  { name: "St. Xavier's University Kolkata", short_name: "SXUK", domain: "sxuk.edu.in" },
  { name: "Amity University Haryana", short_name: "Amity Haryana", domain: "ggn.amity.edu" },
  { name: "The NorthCap University", short_name: "NCU", domain: "ncuindia.edu" },
  { name: "Sushant University", short_name: "Ansal University", domain: "sushantuniversity.edu.in" },
  { name: "IFTM University", short_name: "IFTM", domain: "iftmuniversity.ac.in" },
  { name: "Integral University", short_name: "Integral", domain: "iul.ac.in" },
  { name: "Babu Banarasi Das University", short_name: "BBDU", domain: "bbdu.ac.in" },
  { name: "Invertis University", short_name: "Invertis", domain: "invertisuniversity.ac.in" },
  { name: "Teerthanker Mahaveer University", short_name: "TMU", domain: "tmu.ac.in" },
  { name: "Shobhit University", short_name: "Shobhit", domain: "shobhituniversity.ac.in" },
  { name: "Mangalayatan University", short_name: "Mangalayatan", domain: "mangalayatan.in" },
  { name: "IIMT University", short_name: "IIMT", domain: "iimtindia.net" },
  { name: "Monad University", short_name: "Monad", domain: "monad.edu.in" },
  { name: "Maharishi University of Information Technology", short_name: "MUIT", domain: "muit.in" },
  { name: "Era University", short_name: "Era", domain: "erauniversity.in" },
  { name: "Bareilly International University", short_name: "BIU", domain: "biu.edu.in" },
  { name: "Rama University", short_name: "Rama", domain: "ramauniversity.ac.in" },
  { name: "Amity University Lucknow", short_name: "Amity Lucknow", domain: "lko.amity.edu" },
  { name: "G.L. Bajaj Institute", short_name: "GL Bajaj", domain: "glbitm.org" },
  { name: "Noida International University", short_name: "NIU", domain: "niu.edu.in" },
  { name: "Sharda University", short_name: "Sharda", domain: "shardau.ac.in" },
  { name: "Jaypee Institute of Information Technology", short_name: "JIIT", domain: "jiit.ac.in" },
  { name: "Jaypee University of Information Technology", short_name: "JUIT", domain: "juit.ac.in" },
  { name: "Jaypee University Anoopshahr", short_name: "JU Anoopshahr", domain: "jaypeeu.ac.in" },
  { name: "Shiv Nadar University Chennai", short_name: "SNU Chennai", domain: "snuchennai.edu.in" },
  { name: "K.R. Mangalam University", short_name: "KRMU", domain: "krmangalam.edu.in" },
  { name: "ICFAI University Himachal", short_name: "ICFAI HP", domain: "iuhimachal.edu.in" },
  { name: "Bahra University", short_name: "Bahra", domain: "bahrauniversity.edu.in" },
  { name: "APG Shimla University", short_name: "APG Shimla", domain: "agu.edu.in" },
  { name: "Abhilashi University", short_name: "Abhilashi", domain: "abhilashiuniversity.ac.in" },
  { name: "Arni University", short_name: "Arni", domain: "arniuniversity.edu.in" },
  { name: "Eternal University", short_name: "Eternal", domain: "eternaluniversity.edu.in" },
  { name: "Indus International University", short_name: "IIU HP", domain: "iiuedu.in" },
  { name: "Maharaja Agrasen University", short_name: "MAU HP", domain: "mau.ac.in" },
  { name: "Manav Bharti University", short_name: "MBU", domain: "manavbhartiuniversity.edu.in" },
  { name: "ICFAI University Sikkim", short_name: "ICFAI Sikkim", domain: "iusikkim.edu.in" },
  { name: "Sikkim Manipal University", short_name: "SMU", domain: "smu.edu.in" },
  { name: "SRM University Sikkim", short_name: "SRM Sikkim", domain: "srmus.ac.in" },
  { name: "Assam Down Town University", short_name: "AdtU", domain: "adtu.in" },
  { name: "Kaziranga University", short_name: "KU Assam", domain: "kzu.ac.in" },
  { name: "Royal Global University", short_name: "RGU", domain: "rgu.ac" },
  { name: "Assam Don Bosco University", short_name: "ADBU", domain: "dbuniversity.ac.in" },
  { name: "The Assam Royal Global University", short_name: "RGU Assam", domain: "rguassam.ac.in" },
  { name: "University of Science and Technology Meghalaya", short_name: "USTM", domain: "ustm.ac.in" },
  { name: "CMJ University", short_name: "CMJ", domain: "cmjuniversity.edu.in" },
  { name: "Martin Luther Christian University", short_name: "MLCU", domain: "mlcuniv.in" },
  { name: "William Carey University", short_name: "WCU", domain: "wcu.edu.in" },
  { name: "ICFAI University Meghalaya", short_name: "ICFAI Meghalaya", domain: "iumeghalaya.edu.in" },
  { name: "ICFAI University Tripura", short_name: "ICFAI Tripura", domain: "iutripura.edu.in" },
  { name: "ICFAI University Mizoram", short_name: "ICFAI Mizoram", domain: "iumizoram.edu.in" },
  { name: "ICFAI University Nagaland", short_name: "ICFAI Nagaland", domain: "iunagaland.edu.in" },
  { name: "St. Joseph University Nagaland", short_name: "SJU Nagaland", domain: "stjosephuniv.edu.in" },
  { name: "The Global Open University Nagaland", short_name: "TGOU", domain: "nagaland.net.in" },
  { name: "Arunachal University of Studies", short_name: "AUS", domain: "arunachaluniversity.ac.in" },
  { name: "Himalayan University", short_name: "HU AP", domain: "himalayanuniversity.com" },
  { name: "Apex Professional University", short_name: "APU AP", domain: "apexuniversity.co.in" },
  { name: "ICFAI University Arunachal", short_name: "ICFAI AP", domain: "iuarunachal.edu.in" },
  { name: "Sangai International University", short_name: "SIU Manipur", domain: "sangaiinternationaluniversity.com" },
  { name: "Manipur International University", short_name: "MIU", domain: "miu.edu.in" },
  { name: "Asian International University", short_name: "AIU Manipur", domain: "aiu.edu.in" },
];

/** Private / deemed university email patterns that are not always .ac.in / .edu.in */
const PRIVATE_DOMAIN_SUFFIXES = [
  ".amity.edu",
  ".manipal.edu",
  ".srmist.edu.in",
  ".vit.ac.in",
  ".vitstudent.ac.in",
  ".lpu.co.in",
  ".lpu.in",
  ".cuchd.in",
  ".nmims.edu",
  ".christuniversity.in",
  ".siu.edu.in",
  ".jgu.edu.in",
  ".ashoka.edu.in",
  ".snu.edu.in",
  ".upes.ac.in",
  ".geu.ac.in",
  ".sharda.ac.in",
  ".bennett.edu.in",
  ".chitkara.edu.in",
  ".kiit.ac.in",
  ".soa.ac.in",
  ".paruluniversity.ac.in",
  ".nirmauni.ac.in",
  ".mitwpu.edu.in",
  ".flame.edu.in",
  ".kluniversity.in",
  ".gitam.edu",
  ".gitam.in",
  ".jainuniversity.ac.in",
  ".reva.edu.in",
  ".alliance.edu.in",
  ".azimpremjiuniversity.edu.in",
  ".thapar.edu",
  ".pes.edu",
  ".amrita.edu",
  ".bits-pilani.ac.in",
];

function isIndianAcademicDomain(domain: string) {
  if (
    domain.endsWith(".ac.in") ||
    domain.endsWith(".edu.in") ||
    domain.endsWith(".res.in") ||
    domain.endsWith(".ernet.in") ||
    domain.endsWith(".nic.in")
  ) {
    return true;
  }
  return PRIVATE_DOMAIN_SUFFIXES.some(
    (s) => domain === s.slice(1) || domain.endsWith(s),
  );
}

function matchLocalCollege(domain: string) {
  return (
    INDIA_COLLEGES.filter((c) => domain === c.domain || domain.endsWith("." + c.domain)).sort(
      (a, b) => b.domain.length - a.domain.length,
    )[0] ?? null
  );
}

/** Resolve college for an email — local list first, then Supabase. */
export async function findCollege(email: string) {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;

  // 1) Instant local match (no network)
  const local = matchLocalCollege(domain);
  if (local) return { id: "", ...local };

  // 2) Server resolver (auto-creates unknown .ac.in / .edu.in rows when migration is applied)
  try {
    const { data: rpcRows, error: rpcError } = await supabase.rpc("lookup_college_for_email", {
      _email: email,
    });
    if (!rpcError && rpcRows && rpcRows.length > 0) {
      return rpcRows[0] as { id: string; name: string; short_name: string; domain: string };
    }
  } catch {
    // ignore — offline / migration not applied
  }

  // 3) Table scan fallback
  try {
    const { data } = await supabase.from("colleges").select("id, name, short_name, domain");
    const match =
      (data ?? [])
        .filter((c) => domain === c.domain || domain.endsWith("." + c.domain))
        .sort((a, b) => b.domain.length - a.domain.length)[0] ?? null;
    if (match) return match;
  } catch {
    // ignore
  }

  // 4) Any official Indian academic TLD
  if (isIndianAcademicDomain(domain)) {
    const label = domain.split(".")[0]?.replace(/-/g, " ") ?? domain;
    return {
      id: "",
      name: label.replace(/\b\w/g, (c) => c.toUpperCase()),
      short_name: domain.split(".")[0]?.toUpperCase() ?? domain,
      domain,
    };
  }

  return null;
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function yearLabel(y: number | null) {
  if (!y) return "";
  return ["1st", "2nd", "3rd", "4th", "5th", "6th"][y - 1] + " year";
}
