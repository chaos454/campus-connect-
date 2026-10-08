-- Expand Indian college coverage and allow any official Indian academic email
-- (.ac.in, .edu.in, .res.in, .ernet.in) to resolve to a college row.

-- Major IITs
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('Indian Institute of Technology Madras', 'IIT Madras', 'Chennai', 'iitm.ac.in'),
 ('Indian Institute of Technology Kanpur', 'IIT Kanpur', 'Kanpur', 'iitk.ac.in'),
 ('Indian Institute of Technology Roorkee', 'IIT Roorkee', 'Roorkee', 'iitr.ac.in'),
 ('Indian Institute of Technology Guwahati', 'IIT Guwahati', 'Guwahati', 'iitg.ac.in'),
 ('Indian Institute of Technology Hyderabad', 'IIT Hyderabad', 'Hyderabad', 'iith.ac.in'),
 ('Indian Institute of Technology Indore', 'IIT Indore', 'Indore', 'iiti.ac.in'),
 ('Indian Institute of Technology BHU', 'IIT BHU', 'Varanasi', 'iitbhu.ac.in'),
 ('Indian Institute of Technology Ropar', 'IIT Ropar', 'Ropar', 'iitrpr.ac.in'),
 ('Indian Institute of Technology Mandi', 'IIT Mandi', 'Mandi', 'iitmandi.ac.in'),
 ('Indian Institute of Technology Gandhinagar', 'IIT Gandhinagar', 'Gandhinagar', 'iitgn.ac.in'),
 ('Indian Institute of Technology Jodhpur', 'IIT Jodhpur', 'Jodhpur', 'iitj.ac.in'),
 ('Indian Institute of Technology Patna', 'IIT Patna', 'Patna', 'iitp.ac.in'),
 ('Indian Institute of Technology Bhubaneswar', 'IIT Bhubaneswar', 'Bhubaneswar', 'iitbbs.ac.in'),
 ('Indian Institute of Technology Tirupati', 'IIT Tirupati', 'Tirupati', 'iittp.ac.in'),
 ('Indian Institute of Technology Palakkad', 'IIT Palakkad', 'Palakkad', 'iitpkd.ac.in'),
 ('Indian Institute of Technology Dhanbad', 'IIT ISM Dhanbad', 'Dhanbad', 'iitism.ac.in'),
 ('Indian Institute of Technology Jammu', 'IIT Jammu', 'Jammu', 'iitjammu.ac.in'),
 ('Indian Institute of Technology Bhilai', 'IIT Bhilai', 'Bhilai', 'iitbhilai.ac.in'),
 ('Indian Institute of Technology Goa', 'IIT Goa', 'Goa', 'iitgoa.ac.in'),
 ('Indian Institute of Technology Dharwad', 'IIT Dharwad', 'Dharwad', 'iitdh.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- NITs
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('National Institute of Technology Trichy', 'NIT Trichy', 'Tiruchirappalli', 'nitt.edu'),
 ('National Institute of Technology Karnataka', 'NITK Surathkal', 'Surathkal', 'nitk.edu.in'),
 ('National Institute of Technology Warangal', 'NIT Warangal', 'Warangal', 'nitw.ac.in'),
 ('National Institute of Technology Calicut', 'NIT Calicut', 'Calicut', 'nitc.ac.in'),
 ('National Institute of Technology Rourkela', 'NIT Rourkela', 'Rourkela', 'nitrkl.ac.in'),
 ('National Institute of Technology Durgapur', 'NIT Durgapur', 'Durgapur', 'nitdgp.ac.in'),
 ('National Institute of Technology Kurukshetra', 'NIT Kurukshetra', 'Kurukshetra', 'nitkkr.ac.in'),
 ('National Institute of Technology Jaipur', 'MNIT Jaipur', 'Jaipur', 'mnit.ac.in'),
 ('National Institute of Technology Allahabad', 'MNNIT Allahabad', 'Prayagraj', 'mnnit.ac.in'),
 ('National Institute of Technology Bhopal', 'MANIT Bhopal', 'Bhopal', 'manit.ac.in'),
 ('National Institute of Technology Jalandhar', 'NIT Jalandhar', 'Jalandhar', 'nitj.ac.in'),
 ('National Institute of Technology Hamirpur', 'NIT Hamirpur', 'Hamirpur', 'nith.ac.in'),
 ('National Institute of Technology Jamshedpur', 'NIT Jamshedpur', 'Jamshedpur', 'nitjsr.ac.in'),
 ('National Institute of Technology Patna', 'NIT Patna', 'Patna', 'nitp.ac.in'),
 ('National Institute of Technology Raipur', 'NIT Raipur', 'Raipur', 'nitrr.ac.in'),
 ('National Institute of Technology Silchar', 'NIT Silchar', 'Silchar', 'nits.ac.in'),
 ('National Institute of Technology Srinagar', 'NIT Srinagar', 'Srinagar', 'nitsri.ac.in'),
 ('National Institute of Technology Agartala', 'NIT Agartala', 'Agartala', 'nita.ac.in'),
 ('National Institute of Technology Meghalaya', 'NIT Meghalaya', 'Shillong', 'nitm.ac.in'),
 ('National Institute of Technology Goa', 'NIT Goa', 'Goa', 'nitgoa.ac.in'),
 ('National Institute of Technology Puducherry', 'NIT Puducherry', 'Puducherry', 'nitpy.ac.in'),
 ('National Institute of Technology Delhi', 'NIT Delhi', 'New Delhi', 'nitdelhi.ac.in'),
 ('National Institute of Technology Uttarakhand', 'NIT Uttarakhand', 'Srinagar Garhwal', 'nituk.ac.in'),
 ('National Institute of Technology Andhra Pradesh', 'NIT Andhra', 'Tadepalligudem', 'nitandhra.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- IIITs
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('International Institute of Information Technology Hyderabad', 'IIIT Hyderabad', 'Hyderabad', 'iiit.ac.in'),
 ('Indian Institute of Information Technology Allahabad', 'IIIT Allahabad', 'Prayagraj', 'iiita.ac.in'),
 ('ABV Indian Institute of Information Technology and Management', 'ABV-IIITM Gwalior', 'Gwalior', 'iiitm.ac.in'),
 ('Indian Institute of Information Technology Design and Manufacturing Kancheepuram', 'IIITDM Kancheepuram', 'Chennai', 'iiitdm.ac.in'),
 ('Indian Institute of Information Technology Design and Manufacturing Jabalpur', 'IIITDM Jabalpur', 'Jabalpur', 'iiitdmj.ac.in'),
 ('Indian Institute of Information Technology Bangalore', 'IIIT Bangalore', 'Bengaluru', 'iiitb.ac.in'),
 ('Indian Institute of Information Technology Guwahati', 'IIIT Guwahati', 'Guwahati', 'iiitg.ac.in'),
 ('Indian Institute of Information Technology Delhi', 'IIIT Delhi', 'New Delhi', 'iiitd.ac.in'),
 ('Indian Institute of Information Technology Lucknow', 'IIIT Lucknow', 'Lucknow', 'iiitl.ac.in'),
 ('Indian Institute of Information Technology Pune', 'IIIT Pune', 'Pune', 'iiitp.ac.in'),
 ('Indian Institute of Information Technology Kota', 'IIIT Kota', 'Kota', 'iiitkota.ac.in'),
 ('Indian Institute of Information Technology Una', 'IIIT Una', 'Una', 'iiitu.ac.in'),
 ('Indian Institute of Information Technology Sri City', 'IIIT Sri City', 'Sri City', 'iiits.ac.in'),
 ('Indian Institute of Information Technology Vadodara', 'IIIT Vadodara', 'Vadodara', 'iiitvadodara.ac.in'),
 ('Indian Institute of Information Technology Kalyani', 'IIIT Kalyani', 'Kalyani', 'iiitkalyani.ac.in'),
 ('Indian Institute of Information Technology Nagpur', 'IIIT Nagpur', 'Nagpur', 'iiitn.ac.in'),
 ('Indian Institute of Information Technology Ranchi', 'IIIT Ranchi', 'Ranchi', 'iiitranchi.ac.in'),
 ('Indian Institute of Information Technology Bhagalpur', 'IIIT Bhagalpur', 'Bhagalpur', 'iiitbh.ac.in'),
 ('Indian Institute of Information Technology Bhopal', 'IIIT Bhopal', 'Bhopal', 'iiitbhopal.ac.in'),
 ('Indian Institute of Information Technology Surat', 'IIIT Surat', 'Surat', 'iiitsurat.ac.in'),
 ('Indian Institute of Information Technology Agartala', 'IIIT Agartala', 'Agartala', 'iiitagartala.ac.in'),
 ('Indian Institute of Information Technology Dharwad', 'IIIT Dharwad', 'Dharwad', 'iiitdwd.ac.in'),
 ('Indian Institute of Information Technology Kottayam', 'IIIT Kottayam', 'Kottayam', 'iiitkottayam.ac.in'),
 ('Indian Institute of Information Technology Manipur', 'IIIT Manipur', 'Imphal', 'iiitmanipur.ac.in'),
 ('Indian Institute of Information Technology Tiruchirappalli', 'IIIT Trichy', 'Tiruchirappalli', 'iiitt.ac.in'),
 ('Indian Institute of Information Technology Sonepat', 'IIIT Sonepat', 'Sonepat', 'iiitsonepat.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- IISc, IISERs, NISER, ISI, etc.
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('Indian Institute of Science', 'IISc Bangalore', 'Bengaluru', 'iisc.ac.in'),
 ('Indian Institute of Science Education and Research Pune', 'IISER Pune', 'Pune', 'iiserpune.ac.in'),
 ('Indian Institute of Science Education and Research Kolkata', 'IISER Kolkata', 'Kolkata', 'iiserkol.ac.in'),
 ('Indian Institute of Science Education and Research Mohali', 'IISER Mohali', 'Mohali', 'iisermohali.ac.in'),
 ('Indian Institute of Science Education and Research Bhopal', 'IISER Bhopal', 'Bhopal', 'iiserb.ac.in'),
 ('Indian Institute of Science Education and Research Thiruvananthapuram', 'IISER TVM', 'Thiruvananthapuram', 'iisertvm.ac.in'),
 ('Indian Institute of Science Education and Research Tirupati', 'IISER Tirupati', 'Tirupati', 'iisertirupati.ac.in'),
 ('Indian Institute of Science Education and Research Berhampur', 'IISER Berhampur', 'Berhampur', 'iiserbpr.ac.in'),
 ('National Institute of Science Education and Research', 'NISER', 'Bhubaneswar', 'niser.ac.in'),
 ('Indian Statistical Institute', 'ISI Kolkata', 'Kolkata', 'isical.ac.in'),
 ('Indian Statistical Institute Bangalore', 'ISI Bangalore', 'Bengaluru', 'isibang.ac.in'),
 ('Indian Statistical Institute Delhi', 'ISI Delhi', 'New Delhi', 'isid.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- Central & major state universities
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('University of Delhi', 'DU', 'New Delhi', 'du.ac.in'),
 ('Jawaharlal Nehru University', 'JNU', 'New Delhi', 'jnu.ac.in'),
 ('Banaras Hindu University', 'BHU', 'Varanasi', 'bhu.ac.in'),
 ('University of Hyderabad', 'UoH', 'Hyderabad', 'uohyd.ac.in'),
 ('University of Mumbai', 'Mumbai University', 'Mumbai', 'mu.ac.in'),
 ('University of Calcutta', 'Calcutta University', 'Kolkata', 'caluniv.ac.in'),
 ('University of Madras', 'Madras University', 'Chennai', 'unom.ac.in'),
 ('Anna University', 'Anna University', 'Chennai', 'annauniv.edu'),
 ('Aligarh Muslim University', 'AMU', 'Aligarh', 'amu.ac.in'),
 ('Jamia Millia Islamia', 'JMI', 'New Delhi', 'jmi.ac.in'),
 ('Panjab University', 'PU', 'Chandigarh', 'puchd.ac.in'),
 ('Osmania University', 'OU', 'Hyderabad', 'osmania.ac.in'),
 ('Savitribai Phule Pune University', 'SPPU', 'Pune', 'unipune.ac.in'),
 ('University of Rajasthan', 'UOR', 'Jaipur', 'uniraj.ac.in'),
 ('Gujarat University', 'GU', 'Ahmedabad', 'gujaratuniversity.ac.in'),
 ('Andhra University', 'AU', 'Visakhapatnam', 'andhrauniversity.edu.in'),
 ('Bangalore University', 'BU', 'Bengaluru', 'bangaloreuniversity.ac.in'),
 ('University of Kerala', 'Kerala University', 'Thiruvananthapuram', 'keralauniversity.ac.in'),
 ('Cochin University of Science and Technology', 'CUSAT', 'Kochi', 'cusat.ac.in'),
 ('University of Mysore', 'UoM', 'Mysuru', 'uni-mysore.ac.in'),
 ('Visvesvaraya Technological University', 'VTU', 'Belagavi', 'vtu.ac.in'),
 ('Jawaharlal Nehru Technological University Hyderabad', 'JNTUH', 'Hyderabad', 'jntuh.ac.in'),
 ('Jawaharlal Nehru Technological University Kakinada', 'JNTUK', 'Kakinada', 'jntuk.edu.in'),
 ('Maulana Abul Kalam Azad University of Technology', 'MAKAUT', 'Kolkata', 'makautwb.ac.in'),
 ('West Bengal University of Technology', 'WBUT', 'Kolkata', 'wbut.ac.in'),
 ('Guru Gobind Singh Indraprastha University', 'IPU', 'New Delhi', 'ipu.ac.in'),
 ('Ambedkar University Delhi', 'AUD', 'New Delhi', 'aud.ac.in'),
 ('Indira Gandhi National Open University', 'IGNOU', 'New Delhi', 'ignou.ac.in'),
 ('Tata Institute of Social Sciences', 'TISS', 'Mumbai', 'tiss.edu'),
 ('Tata Institute of Fundamental Research', 'TIFR', 'Mumbai', 'tifr.res.in')
ON CONFLICT (domain) DO NOTHING;

-- Engineering / private / other well-known
INSERT INTO public.colleges (name, short_name, city, domain) VALUES
 ('BITS Pilani', 'BITS Pilani', 'Pilani', 'bits-pilani.ac.in'),
 ('BITS Goa', 'BITS Goa', 'Goa', 'goa.bits-pilani.ac.in'),
 ('BITS Hyderabad', 'BITS Hyderabad', 'Hyderabad', 'hyderabad.bits-pilani.ac.in'),
 ('Birla Institute of Technology Mesra', 'BIT Mesra', 'Ranchi', 'bitmesra.ac.in'),
 ('Vellore Institute of Technology', 'VIT', 'Vellore', 'vit.ac.in'),
 ('VIT Chennai', 'VIT Chennai', 'Chennai', 'vitchennai.ac.in'),
 ('VIT Bhopal', 'VIT Bhopal', 'Bhopal', 'vitbhopal.ac.in'),
 ('VIT AP', 'VIT AP', 'Amaravati', 'vitap.ac.in'),
 ('SRM Institute of Science and Technology', 'SRM', 'Chennai', 'srmist.edu.in'),
 ('Manipal Academy of Higher Education', 'Manipal', 'Manipal', 'manipal.edu'),
 ('Amrita Vishwa Vidyapeetham', 'Amrita', 'Coimbatore', 'amrita.edu'),
 ('Thapar Institute of Engineering and Technology', 'Thapar', 'Patiala', 'thapar.edu'),
 ('PES University', 'PES', 'Bengaluru', 'pes.edu'),
 ('RV College of Engineering', 'RVCE', 'Bengaluru', 'rvce.edu.in'),
 ('BMS College of Engineering', 'BMSCE', 'Bengaluru', 'bmsce.ac.in'),
 ('College of Engineering Pune', 'COEP', 'Pune', 'coep.org.in'),
 ('Veermata Jijabai Technological Institute', 'VJTI', 'Mumbai', 'vjti.ac.in'),
 ('College of Engineering Guindy', 'CEG', 'Chennai', 'annauniv.edu'),
 ('PSG College of Technology', 'PSG Tech', 'Coimbatore', 'psgtech.ac.in'),
 ('National Institute of Technology Kurukshetra Alumni', 'NITKKR', 'Kurukshetra', 'nitkkr.ac.in'),
 ('Indian Institute of Management Ahmedabad', 'IIM Ahmedabad', 'Ahmedabad', 'iima.ac.in'),
 ('Indian Institute of Management Bangalore', 'IIM Bangalore', 'Bengaluru', 'iimb.ac.in'),
 ('Indian Institute of Management Calcutta', 'IIM Calcutta', 'Kolkata', 'iimcal.ac.in'),
 ('Indian Institute of Management Lucknow', 'IIM Lucknow', 'Lucknow', 'iiml.ac.in'),
 ('Indian Institute of Management Indore', 'IIM Indore', 'Indore', 'iimidr.ac.in'),
 ('Indian Institute of Management Kozhikode', 'IIM Kozhikode', 'Kozhikode', 'iimk.ac.in'),
 ('XLRI Jamshedpur', 'XLRI', 'Jamshedpur', 'xlri.ac.in'),
 ('Faculty of Management Studies Delhi', 'FMS Delhi', 'New Delhi', 'fms.edu'),
 ('Netaji Subhas University of Technology', 'NSUT', 'New Delhi', 'nsut.ac.in'),
 ('Indraprastha Institute of Information Technology Delhi', 'IIITD', 'New Delhi', 'iiitd.ac.in'),
 ('Jamia Hamdard', 'Jamia Hamdard', 'New Delhi', 'jamiahamdard.ac.in'),
 ('Symbiosis International University', 'SIU', 'Pune', 'siu.edu.in'),
 ('Christ University', 'Christ', 'Bengaluru', 'christuniversity.in'),
 ('Ashoka University', 'Ashoka', 'Sonipat', 'ashoka.edu.in'),
 ('Shiv Nadar University', 'SNU', 'Greater Noida', 'snu.edu.in'),
 ('Kalinga Institute of Industrial Technology', 'KIIT', 'Bhubaneswar', 'kiit.ac.in'),
 ('Siksha O Anusandhan', 'SOA', 'Bhubaneswar', 'soa.ac.in'),
 ('Lovely Professional University', 'LPU', 'Phagwara', 'lpu.co.in'),
 ('Chandigarh University', 'CU', 'Mohali', 'cuchd.in'),
 ('Amity University Noida', 'Amity', 'Noida', 'amity.edu'),
 ('Graphic Era University', 'GEU', 'Dehradun', 'geu.ac.in'),
 ('UPES Dehradun', 'UPES', 'Dehradun', 'ddn.upes.ac.in'),
 ('Nirma University', 'Nirma', 'Ahmedabad', 'nirmauni.ac.in'),
 ('DAIICT Gandhinagar', 'DAIICT', 'Gandhinagar', 'daiict.ac.in'),
 ('LNMIIT Jaipur', 'LNMIIT', 'Jaipur', 'lnmiit.ac.in'),
 ('IIITM Gwalior', 'IIITM', 'Gwalior', 'iiitm.ac.in'),
 ('Harcourt Butler Technical University', 'HBTU', 'Kanpur', 'hbtu.ac.in'),
 ('Jadavpur University', 'JU', 'Kolkata', 'jaduniv.edu.in'),
 ('Presidency University Kolkata', 'Presidency', 'Kolkata', 'presiuniv.ac.in'),
 ('St. Xavier''s College Kolkata', 'St Xaviers Kolkata', 'Kolkata', 'sxccal.edu'),
 ('Loyola College Chennai', 'Loyola', 'Chennai', 'loyolacollege.edu'),
 ('St. Stephen''s College Delhi', 'St Stephens', 'New Delhi', 'ststephens.edu'),
 ('Hindu College Delhi', 'Hindu College', 'New Delhi', 'hinducollege.ac.in'),
 ('Miranda House Delhi', 'Miranda House', 'New Delhi', 'mirandahouse.ac.in'),
 ('Lady Shri Ram College', 'LSR', 'New Delhi', 'lsr.edu.in'),
 ('Sri Venkateswara College Delhi', 'SVC', 'New Delhi', 'svc.ac.in'),
 ('Hansraj College Delhi', 'Hansraj', 'New Delhi', 'hansrajcollege.ac.in'),
 ('Ramjas College Delhi', 'Ramjas', 'New Delhi', 'ramjas.du.ac.in'),
 ('Kirori Mal College Delhi', 'KMC', 'New Delhi', 'kmcollege.ac.in'),
 ('Gargi College Delhi', 'Gargi', 'New Delhi', 'gargicollege.in'),
 ('Shaheed Sukhdev College of Business Studies', 'SSCBS', 'New Delhi', 'sscbsdu.ac.in'),
 ('All India Institute of Medical Sciences Delhi', 'AIIMS Delhi', 'New Delhi', 'aiims.edu'),
 ('Christian Medical College Vellore', 'CMC Vellore', 'Vellore', 'cmcvellore.ac.in'),
 ('Armed Forces Medical College', 'AFMC', 'Pune', 'afmc.nic.in'),
 ('JIPMER Puducherry', 'JIPMER', 'Puducherry', 'jipmer.edu.in'),
 ('King George''s Medical University', 'KGMU', 'Lucknow', 'kgmu.org'),
 ('Maulana Azad Medical College', 'MAMC', 'New Delhi', 'mamc.ac.in'),
 ('Lady Hardinge Medical College', 'LHMC', 'New Delhi', 'lhmc-hosp.gov.in'),
 ('Institute of Chemical Technology Mumbai', 'ICT Mumbai', 'Mumbai', 'ictmumbai.edu.in'),
 ('Institute of Technology Nirma University', 'ITNU', 'Ahmedabad', 'nirmauni.ac.in'),
 ('Sardar Vallabhbhai National Institute of Technology', 'SVNIT', 'Surat', 'svnit.ac.in'),
 ('Visvesvaraya National Institute of Technology', 'VNIT', 'Nagpur', 'vnit.ac.in'),
 ('Motilal Nehru National Institute of Technology', 'MNNIT', 'Prayagraj', 'mnnit.ac.in'),
 ('Malaviya National Institute of Technology', 'MNIT', 'Jaipur', 'mnit.ac.in')
ON CONFLICT (domain) DO NOTHING;

-- Resolve / auto-create college for any Indian academic email domain
CREATE OR REPLACE FUNCTION public.college_for_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d text := lower(split_part(_email, '@', 2));
  found uuid;
  pretty text;
BEGIN
  IF d IS NULL OR d = '' THEN
    RETURN NULL;
  END IF;

  -- Exact or parent-domain match (longest domain wins)
  SELECT c.id INTO found
  FROM public.colleges c
  WHERE d = c.domain OR d LIKE '%.' || c.domain
  ORDER BY length(c.domain) DESC
  LIMIT 1;

  IF found IS NOT NULL THEN
    RETURN found;
  END IF;

  -- Auto-accept official Indian academic TLDs
  IF d LIKE '%.ac.in'
     OR d LIKE '%.edu.in'
     OR d LIKE '%.res.in'
     OR d LIKE '%.ernet.in'
     OR d LIKE '%.nic.in'
  THEN
    pretty := initcap(replace(split_part(d, '.', 1), '-', ' '));

    INSERT INTO public.colleges (name, short_name, city, domain)
    VALUES (
      pretty || ' (auto)',
      upper(split_part(d, '.', 1)),
      NULL,
      d
    )
    ON CONFLICT (domain) DO UPDATE SET domain = EXCLUDED.domain
    RETURNING id INTO found;

    RETURN found;
  END IF;

  RETURN NULL;
END;
$$;

-- Client-callable helper used at signup to show college name
CREATE OR REPLACE FUNCTION public.lookup_college_for_email(_email text)
RETURNS TABLE (id uuid, name text, short_name text, domain text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
BEGIN
  cid := public.college_for_email(_email);
  IF cid IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.short_name, c.domain
    FROM public.colleges c
    WHERE c.id = cid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.college_for_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_college_for_email(text) TO anon, authenticated;
