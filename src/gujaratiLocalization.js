const PHRASES = {
  'home': 'મુખ્ય પાનું',
  'settings': 'સેટિંગ્સ',
  'family': 'પરિવાર',
  'accounts': 'ખાતાં',
  'budget': 'બજેટ',
  'forecast': 'આગાહી',
  'report': 'અહેવાલ',
  'goals': 'લક્ષ્યો',
  'limits': 'મર્યાદાઓ',
  'recurring': 'આવર્તિત',
  'add entry': 'નોંધ ઉમેરો',
  'analytics': 'વિશ્લેષણ',
  'trends': 'વલણો',
  'calendar': 'કૅલેન્ડર',
  'transactions': 'વ્યવહારો',
  'activity': 'પ્રવૃત્તિ',
  'feedback': 'પ્રતિસાદ',
  'backup': 'બૅકઅપ',
  'overview': 'ઝાંખી',
  'users': 'વપરાશકર્તાઓ',
  'all': 'બધા',
  'income': 'આવક',
  'expense': 'ખર્ચ',
  'transfer': 'હસ્તાંતરણ',
  'sign in': 'પ્રવેશ કરો',
  'sign up': 'ખાતું બનાવો',
  'log in': 'પ્રવેશ કરો',
  'log out': 'બહાર નીકળો',
  'admin login': 'સંચાલક પ્રવેશ',
  'light theme': 'લાઇટ થીમ',
  'dark theme': 'ડાર્ક થીમ',
  'light mode': 'લાઇટ મોડ',
  'dark mode': 'ડાર્ક મોડ',
  'switch to light mode': 'લાઇટ મોડ પર બદલો',
  'switch to dark mode': 'ડાર્ક મોડ પર બદલો',
  'privacy policy': 'ગોપનીયતા નીતિ',
  'about us': 'અમારા વિશે',
  'contact us': 'સંપર્ક કરો',
  'expense tracking': 'ખર્ચનો હિસાબ',
  'family sharing': 'પરિવાર સાથે વહેંચણી',
  'transfer between accounts': 'ખાતાઓ વચ્ચે નાણાં મોકલો',
  'search feedback by email, category, or message': 'ઇમેઇલ, શ્રેણી અથવા સંદેશથી પ્રતિસાદ શોધો',
  'sign in to admin': 'સંચાલક તરીકે પ્રવેશ કરો',
  'sign in to your account': 'તમારા ખાતામાં પ્રવેશ કરો',
  'you are in': 'તમે અત્યારે અહીં છો',
  'users could not load': 'વપરાશકર્તાઓ લાવી શકાયા નથી',
  'the admin page could not load': 'સંચાલક પાનું ખોલી શકાયું નથી',
  'monthly activity': 'માસિક પ્રવૃત્તિ',
  'monthly registrations': 'માસિક નોંધણીઓ',
  'account access required': 'ખાતાનો પ્રવેશ જરૂરી છે',
  'confirm account access change': 'ખાતાના પ્રવેશમાં ફેરફારની પુષ્ટિ કરો',
  'manage status': 'સ્થિતિ સંચાલિત કરો',
  'new accounts': 'નવા ખાતાં',
  'active accounts': 'સક્રિય ખાતાં',
  'account name': 'ખાતાનું નામ',
  'accounts and balances': 'ખાતાં અને બાકી રકમ',
  'all activity': 'બધી પ્રવૃત્તિ',
  'all categories': 'બધી શ્રેણીઓ',
  'sort by': 'ક્રમ ગોઠવો',
  'newest first': 'નવું પહેલાં',
  'oldest first': 'જૂનું પહેલાં',
  'highest amount': 'સૌથી વધુ રકમ',
  'lowest amount': 'સૌથી ઓછી રકમ',
  'transfer between accounts': 'ખાતાઓ વચ્ચે નાણાં મોકલો',
  'choose an account': 'ખાતું પસંદ કરો',
  'all loaded': 'બધી માહિતી આવી ગઈ',
  'all loaded records': 'બધી લવાયેલી નોંધો',
  'no activity matches these filters': 'આ ગાળણીઓ સાથે મેળ ખાતી પ્રવૃત્તિ નથી',
  'no transactions added yet': 'હજુ કોઈ વ્યવહાર ઉમેરાયો નથી',
  'no transactions yet': 'હજુ કોઈ વ્યવહાર નથી',
  'nothing to show yet': 'હજુ બતાવવા માટે કંઈ નથી',
  'create one': 'એક બનાવો',
  'create goal': 'લક્ષ્ય બનાવો',
  'add a transaction': 'વ્યવહાર ઉમેરો',
  'add a category': 'શ્રેણી ઉમેરો',
  'add account': 'ખાતું ઉમેરો',
  'add another account': 'બીજું ખાતું ઉમેરો',
  'total account balance': 'ખાતાંની કુલ બાકી રકમ',
  'estimated total account balance': 'ખાતાંની અંદાજિત કુલ બાકી રકમ',
  'monthly budget saved': 'માસિક બજેટ સાચવાયું',
  'same as last month': 'ગયા મહિના જેટલું જ',
  'no income recorded this month': 'આ મહિને આવક નોંધાઈ નથી',
  'no income recorded last month': 'ગયા મહિને આવક નોંધાઈ નથી',
  'add expenses to see your top category': 'મુખ્ય ખર્ચની શ્રેણી જોવા માટે ખર્ચ ઉમેરો',
  'add expenses to reveal your category breakdown.': 'શ્રેણી પ્રમાણે ખર્ચ જોવા માટે ખર્ચ ઉમેરો.',
  'add transactions to see your six-month trend.': 'છ મહિનાનું વલણ જોવા વ્યવહારો ઉમેરો.',
  'family expenses this month': 'આ મહિને પરિવારનો ખર્ચ',
  'all family members can view these transactions.': 'પરિવારના બધા સભ્યો આ વ્યવહારો જોઈ શકે છે.',
  'add income or expenses that all family members can view.': 'પરિવારના બધા સભ્યો જોઈ શકે તેવી આવક કે ખર્ચ ઉમેરો.',
  'are you sure you want to delete this transaction?': 'શું તમે આ વ્યવહાર કાઢી નાખવા માંગો છો?',
  'transaction added successfully!': 'વ્યવહાર સફળતાપૂર્વક ઉમેરાયો!',
  'transaction updated successfully!': 'વ્યવહાર સફળતાપૂર્વક સુધારાયો!',
  'transaction deleted successfully!': 'વ્યવહાર સફળતાપૂર્વક કાઢી નાખ્યો!',
  'unable to load families.': 'પરિવારો લાવી શકાયા નથી.',
  'unable to load family members.': 'પરિવારના સભ્યો લાવી શકાયા નથી.',
  'unable to load transactions.': 'વ્યવહારો લાવી શકાયા નથી.',
  'could not load your feedback.': 'તમારો પ્રતિસાદ લાવી શકાયો નથી.',
  'could not load your activity history.': 'તમારો પ્રવૃત્તિ ઇતિહાસ લાવી શકાયો નથી.',
  'could not load older activity.': 'જૂની પ્રવૃત્તિ લાવી શકાયી નથી.',
  'could not clear your activity history.': 'તમારો પ્રવૃત્તિ ઇતિહાસ સાફ કરી શકાયો નથી.',
  'reset preferences': 'પસંદગીઓ ફરી ગોઠવો',
  'account currently signed in to this admin portal.': 'આ સંચાલક પોર્ટલમાં હાલ પ્રવેશ કરેલું ખાતું.',
  'new users ·': 'નવા વપરાશકર્તાઓ ·',
  'amounts hidden on screen': 'સ્ક્રીન પર રકમ છુપાવેલી છે',
  'all available records are loaded.': 'બધી ઉપલબ્ધ નોંધો લવાઈ ગઈ છે.',
  'latest data loaded successfully': 'નવીનતમ માહિતી સફળતાપૂર્વક લવાઈ',
  'new this month': 'આ મહિને નવા',
  'latest accounts': 'તાજેતરના ખાતાં',
  'admin sessions and settings, account access decisions, and feedback updates.': 'સંચાલક સત્રો અને સેટિંગ્સ, ખાતાના પ્રવેશના નિર્ણયો તથા પ્રતિસાદના સુધારા.',
  'account management': 'ખાતા વ્યવસ્થાપન',
  'budget planning': 'બજેટ આયોજન',
  'savings goals': 'બચતના લક્ષ્યો',
  'financial analytics': 'નાણાકીય વિશ્લેષણ',
  'cloud sync': 'ક્લાઉડ સમન્વયન',
  'data backup': 'માહિતીનો બૅકઅપ',
  'mobile friendly': 'મોબાઇલ માટે અનુકૂળ',
  'total users': 'કુલ વપરાશકર્તાઓ',
  'active users': 'સક્રિય વપરાશકર્તાઓ',
  'new users': 'નવા વપરાશકર્તાઓ',
  'new this month': 'આ મહિને નવા',
  'recent activity': 'તાજેતરની પ્રવૃત્તિ',
  'recent transactions': 'તાજેતરના વ્યવહારો',
  'recent registrations': 'તાજેતરની નોંધણીઓ',
  'daily active accounts': 'દૈનિક સક્રિય ખાતાં',
  'user management': 'વપરાશકર્તા વ્યવસ્થાપન',
  'user directory': 'વપરાશકર્તા યાદી',
  'user profile': 'વપરાશકર્તા પ્રોફાઇલ',
  'account details': 'ખાતાની વિગતો',
  'account health': 'ખાતાની સ્થિતિ',
  'account access': 'ખાતાનો પ્રવેશ',
  'account status': 'ખાતાની સ્થિતિ',
  'access allowed': 'પ્રવેશ મંજૂર',
  'access blocked': 'પ્રવેશ પ્રતિબંધિત',
  'restore account access': 'ખાતાનો પ્રવેશ પુનઃસ્થાપિત કરો',
  'block account access': 'ખાતાનો પ્રવેશ અટકાવો',
  'global settings': 'વૈશ્વિક સેટિંગ્સ',
  'workspace profile': 'કાર્યસ્થળની પ્રોફાઇલ',
  'connected services': 'જોડાયેલી સેવાઓ',
  'application preferences': 'એપની પસંદગીઓ',
  'platform overview': 'પ્લેટફોર્મની ઝાંખી',
  'platform metrics': 'પ્લેટફોર્મના આંકડા',
  'platform report': 'પ્લેટફોર્મ અહેવાલ',
  'feedback inbox': 'પ્રતિસાદ ઇનબૉક્સ',
  'feedback counts': 'પ્રતિસાદની ગણતરી',
  'needs reply': 'જવાબ આપવાનો બાકી',
  'in review': 'સમીક્ષા હેઠળ',
  'assigned to me': 'મને સોંપાયેલું',
  'all statuses': 'બધી સ્થિતિઓ',
  'filter feedback': 'પ્રતિસાદ ગાળો',
  'search users': 'વપરાશકર્તાઓ શોધો',
  'search transactions': 'વ્યવહારો શોધો',
  'search feedback': 'પ્રતિસાદ શોધો',
  'search activity': 'પ્રવૃત્તિ શોધો',
  'export csv': 'સી.એસ.વી. નિકાસ કરો',
  'import csv': 'સી.એસ.વી. આયાત કરો',
  'save changes': 'ફેરફારો સાચવો',
  'create account': 'ખાતું બનાવો',
  'create family': 'પરિવાર બનાવો',
  'join family': 'પરિવારમાં જોડાઓ',
  'join a family': 'પરિવારમાં જોડાઓ',
  'add transaction': 'વ્યવહાર ઉમેરો',
  'add shared transaction': 'સામૂહિક વ્યવહાર ઉમેરો',
  'edit transaction': 'વ્યવહારમાં ફેરફાર કરો',
  'delete transaction': 'વ્યવહાર કાઢી નાખો',
  'create savings goal': 'બચતનું લક્ષ્ય બનાવો',
  'send feedback': 'પ્રતિસાદ મોકલો',
  'send reply': 'જવાબ મોકલો',
  'clear filters': 'ગાળણીઓ સાફ કરો',
  'clear search': 'શોધ સાફ કરો',
  'clear history': 'ઇતિહાસ સાફ કરો',
  'refresh data': 'માહિતી ફરી લાવો',
  'refresh feedback': 'પ્રતિસાદ ફરી લાવો',
  'refresh analytics': 'વિશ્લેષણ ફરી લાવો',
  'last 7 days': 'છેલ્લા ૭ દિવસ',
  'last 30 days': 'છેલ્લા ૩૦ દિવસ',
  'last 90 days': 'છેલ્લા ૯૦ દિવસ',
  'last 6 months': 'છેલ્લા ૬ મહિના',
  'amounts hidden': 'રકમ છુપાવેલી છે',
  'amounts visible': 'રકમ દેખાય છે',
  'on-screen privacy': 'સ્ક્રીન પર ગોપનીયતા',
  'follow device setting': 'ઉપકરણની પસંદગી અનુસરો',
  'reduce animations': 'એનિમેશન ઘટાડો',
  'not available': 'ઉપલબ્ધ નથી',
  'not set': 'નક્કી કર્યું નથી',
  'total income': 'કુલ આવક',
  'total expenses': 'કુલ ખર્ચ',
  'total spent': 'કુલ ખર્ચાયું',
  'income this month': 'આ મહિનાની આવક',
  'expenses this month': 'આ મહિનાનો ખર્ચ',
  'savings rate': 'બચતનો દર',
  'spending calendar': 'ખર્ચનું કૅલેન્ડર',
  'monthly breakdown': 'માસિક વિગત',
  'day details': 'દિવસની વિગતો',
  'view all users': 'બધા વપરાશકર્તાઓ જુઓ',
  'previous page': 'પહેલાનું પાનું',
  'next page': 'આગળનું પાનું',
  'show next month': 'આગળનો મહિનો બતાવો',
  'show previous month': 'પહેલાનો મહિનો બતાવો',
  'choose month to view': 'જોવા માટે મહિનો પસંદ કરો',
  'choose calendar month': 'કૅલેન્ડરનો મહિનો પસંદ કરો',
  'email address': 'ઇમેઇલ સરનામું',
  'date format': 'તારીખનું સ્વરૂપ',
  'first day of the week': 'અઠવાડિયાનો પહેલો દિવસ',
  'motion preference': 'એનિમેશન પસંદગી',
  'layout density': 'પૃષ્ઠ ગોઠવણી',
  'currency display': 'ચલણનું પ્રદર્શન',
  'enter your email': 'તમારું ઇમેઇલ દાખલ કરો',
  'enter your password': 'તમારો પાસવર્ડ દાખલ કરો',
  'show password': 'પાસવર્ડ બતાવો',
  'hide password': 'પાસવર્ડ છુપાવો',
  'loading...': 'લવાઈ રહ્યું છે…',
  'loading…': 'લવાઈ રહ્યું છે…',
  'sending...': 'મોકલાઈ રહ્યું છે…',
  'saving...': 'સાચવાઈ રહ્યું છે…',
  'creating...': 'બનાવાઈ રહ્યું છે…',
  'adding...': 'ઉમેરાઈ રહ્યું છે…',
  'updating': 'સુધારાઈ રહ્યું છે',
  'joining...': 'જોડાઈ રહ્યું છે…',
  'removing...': 'દૂર થઈ રહ્યું છે…',
  'all available': 'બધા ઉપલબ્ધ',
  'received': 'મળ્યો',
  'resolved': 'ઉકેલાયો',
  'registered': 'નોંધાયેલ',
  'suspended': 'સ્થગિત',
  'urgent': 'તાત્કાલિક',
  'general feedback': 'સામાન્ય પ્રતિસાદ',
  'feature idea': 'નવી સુવિધાનો વિચાર',
  'report a problem': 'સમસ્યાની જાણ કરો',
  'expense nest': 'ખર્ચનેસ્ટ',
  'expense nest / admin': 'ખર્ચનેસ્ટ / સંચાલક',
  'user account': 'વપરાશકર્તાનું ખાતું',
  'user id': 'વપરાશકર્તા આઈડી',
  'export csv': 'સી.એસ.વી. નિકાસ કરો',
  'import csv': 'સી.એસ.વી. આયાત કરો',
  'csv': 'સી.એસ.વી.',
  'pdf': 'પી.ડી.એફ.',
  'json': 'જેસન',
  'sql': 'એસ.ક્યુ.એલ.',
  'expense nest': 'ખર્ચનેસ્ટ',
  'expense nest - expense tracker': 'ખર્ચનેસ્ટ · ખર્ચ વ્યવસ્થાપક',
  'expense nest — smart money. better future.': 'ખર્ચનેસ્ટ — સમજદારીથી નાણાં. ઉજ્જવળ ભવિષ્ય.',
  'expense nest. all rights reserved.': 'ખર્ચનેસ્ટ. સર્વ હકો સુરક્ષિત.',
  'expense nest. all rights reserved': 'ખર્ચનેસ્ટ. સર્વ હકો સુરક્ષિત',
  'your money. your control.': 'તમારા નાણાં. તમારું નિયંત્રણ.',
  'welcome back!': 'ફરી સ્વાગત છે!',
  'welcome back': 'ફરી સ્વાગત છે',
  'welcome to expense nest!': 'ખર્ચનેસ્ટમાં આપનું સ્વાગત છે!',
  'money, under control.': 'તમારા નાણાં, હવે નિયંત્રણમાં.',
  'personal finance': 'વ્યક્તિગત નાણાં વ્યવસ્થાપન',
  'saved privately on this device': 'આ ઉપકરણમાં ખાનગી રીતે સાચવેલું',
  'you are in': 'તમે અત્યારે અહીં છો',
  'jump to a dashboard section': 'ડેશબોર્ડના વિભાગ પર જાઓ',
  'track every rupee and make smarter everyday decisions.': 'દરેક રૂપિયાનો હિસાબ રાખો અને રોજિંદા નાણાકીય નિર્ણયો સમજદારીથી લો.',
  'choose how expensenest looks and displays your information.': 'ખર્ચનેસ્ટનો દેખાવ અને માહિતીનું પ્રદર્શન પસંદ કરો.',
  'manage your money smarter.': 'તમારા નાણાં વધુ સમજદારીથી સંભાળો.',
  'start your journey towards smarter money management.': 'સમજદારીભર્યા નાણાં વ્યવસ્થાપનની શરૂઆત કરો.',
  'your financial information is protected.': 'તમારી નાણાકીય માહિતી સુરક્ષિત છે.',
  'please enter your email and password.': 'કૃપા કરીને તમારું ઇમેઇલ અને પાસવર્ડ દાખલ કરો.',
  'please enter your email address first.': 'પહેલાં તમારું ઇમેઇલ સરનામું દાખલ કરો.',
  'password must be at least 6 characters.': 'પાસવર્ડમાં ઓછામાં ઓછા ૬ અક્ષરો હોવા જોઈએ.',
  'account created successfully!': 'ખાતું સફળતાપૂર્વક બનાવાયું!',
  'account created. please login to continue.': 'ખાતું બનાવાયું. આગળ વધવા માટે પ્રવેશ કરો.',
  'login successful!': 'પ્રવેશ સફળ થયો!',
  'something went wrong. please try again.': 'કંઈક ખોટું થયું. કૃપા કરીને ફરી પ્રયાસ કરો.',
  'unable to send reset email.': 'પાસવર્ડ ફરી ગોઠવવાનો ઇમેઇલ મોકલી શકાયો નથી.',
  'if your account exists, a password reset email has been sent.': 'તમારું ખાતું હોય તો પાસવર્ડ ફરી ગોઠવવા માટેનો ઇમેઇલ મોકલ્યો છે.',
  'please wait...': 'કૃપા કરીને રાહ જુઓ…',
  'create your account': 'તમારું ખાતું બનાવો',
  "don't have an account?": 'ખાતું નથી?',
  'already have an account?': 'પહેલેથી ખાતું છે?',
  'login to expensenest →': 'ખર્ચનેસ્ટમાં પ્રવેશ કરો →',
  'create my account →': 'મારું ખાતું બનાવો →',
  'forgot password?': 'પાસવર્ડ ભૂલી ગયા?',
  'sign in to manage your money smarter.': 'તમારા નાણાં સમજદારીથી સંભાળવા માટે પ્રવેશ કરો.',
  'your account is ready. choose how to start.': 'તમારું ખાતું તૈયાર છે. શરૂઆત કેવી રીતે કરવી તે પસંદ કરો.',
  'start fresh karne se is browser ka existing expensenest data clear ho jayega. kya aap sure hain?': 'શરૂઆતથી શરૂ કરવાથી આ બ્રાઉઝરમાંનો હાલનો ખર્ચનેસ્ટ ડેટા કાઢી નાખવામાં આવશે. શું તમે નિશ્ચિત છો?',
  'kya aap expensenest se logout karna chahte hain?': 'શું તમે ખર્ચનેસ્ટમાંથી બહાર નીકળવા માંગો છો?',
  'this account is temporarily blocked': 'આ ખાતા પર અસ્થાયી રૂપે પ્રવેશ પ્રતિબંધિત છે',
  'we could not verify access': 'અમે પ્રવેશની ચકાસણી કરી શક્યા નથી',
  'expense nest paused this session to protect your data. ask the administrator to install account protection, then try again.': 'તમારા ડેટાની સુરક્ષા માટે ખર્ચનેસ્ટે આ સત્ર થોભાવ્યું છે. ખાતાની સુરક્ષા સક્રિય કરવા સંચાલકનો સંપર્ક કરો અને ફરી પ્રયાસ કરો.',
  'preparing your financial dashboard...': 'તમારું નાણાકીય ડેશબોર્ડ તૈયાર થઈ રહ્યું છે…',
  'securely verifying your expensenest workspace.': 'તમારા ખર્ચનેસ્ટ કાર્યસ્થળની સુરક્ષિત રીતે ચકાસણી થઈ રહી છે.',
  'checking admin access': 'સંચાલક પ્રવેશની ચકાસણી થઈ રહી છે',
  'admin access required': 'સંચાલકનો પ્રવેશ જરૂરી છે',
  'could not verify administrator access. please try again.': 'સંચાલકના પ્રવેશની ચકાસણી થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
  'this account is not on the approved administrator list.': 'આ ખાતું મંજૂર સંચાલકોની યાદીમાં નથી.',
  'reset application preferences to their defaults? transactions, budgets and account data will not be changed.': 'એપની પસંદગીઓ મૂળ સ્થિતિમાં ફરી ગોઠવવી છે? વ્યવહારો, બજેટ અને ખાતાની માહિતી બદલાશે નહીં.',
  'a focused workspace for reviewing registrations and keeping your platform organized.': 'નોંધાયેલા ખાતાઓની સમીક્ષા અને પ્લેટફોર્મનું સંચાલન કરવા માટેનું કાર્યસ્થળ.',
  'access is limited to accounts approved by your administrator.': 'પ્રવેશ ફક્ત સંચાલક દ્વારા મંજૂર ખાતાઓ માટે છે.',
  'only approved admin accounts can enter': 'ફક્ત મંજૂર સંચાલક ખાતાઓ પ્રવેશી શકે છે',
  'see the latest dashboard activity': 'ડેશબોર્ડની તાજેતરની પ્રવૃત્તિ જુઓ',
  'find and review registered accounts': 'નોંધાયેલા ખાતાઓ શોધો અને તેમની સમીક્ષા કરો',
  'supabase protected administrator access': 'સુપાબેઝ દ્વારા સુરક્ષિત સંચાલક પ્રવેશ',
  'unable to sign in. please try again.': 'પ્રવેશ થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
  'have a question, suggestion or feedback? we\'d be happy to hear from you.': 'કોઈ પ્રશ્ન, સૂચન કે પ્રતિસાદ છે? અમને જણાવો.',
  'a simple and organized way to understand and manage everyday money.': 'રોજિંદા નાણાં સમજવા અને સંભાળવાની સરળ, વ્યવસ્થિત રીત.',
  'understand how expensenest handles information when you use our platform.': 'અમારા પ્લેટફોર્મનો ઉપયોગ કરતી વખતે ખર્ચનેસ્ટ તમારી માહિતીનો ઉપયોગ કેવી રીતે કરે છે તે જાણો.',
  'depending on how you use expensenest, information may include account details, income, expenses, transactions, budgets, savings goals and preferences that you enter.': 'તમે ખર્ચનેસ્ટનો જે રીતે ઉપયોગ કરો તેના આધારે, તમે દાખલ કરેલી ખાતાની વિગતો, આવક, ખર્ચ, વ્યવહારો, બજેટ, બચતના લક્ષ્યો અને પસંદગીઓનો સમાવેશ થઈ શકે છે.',
  'expensenest uses browser storage for local data and supabase for authentication and cloud synchronization. the information available in your account depends on the features you use. if you submit feedback while signed in, your message, category and account email (when available) are stored in supabase for the expensenest team to review and respond.': 'સ્થાનિક માહિતી માટે ખર્ચનેસ્ટ બ્રાઉઝરનો સંગ્રહ અને ઓળખ ચકાસણી તથા ક્લાઉડ સમન્વયન માટે સુપાબેઝનો ઉપયોગ કરે છે. તમારા ખાતામાં કઈ માહિતી ઉપલબ્ધ હશે તે તમે વાપરતા સુવિધાઓ પર આધાર રાખે છે. પ્રવેશ કર્યા પછી પ્રતિસાદ મોકલો તો તમારો સંદેશ, શ્રેણી અને ઉપલબ્ધ હોય ત્યારે ખાતાનું ઇમેઇલ સુપાબેઝમાં સંગ્રહાય છે, જેથી ખર્ચનેસ્ટની ટીમ તેની સમીક્ષા કરી જવાબ આપી શકે.',
  'information is used to provide expense tracking, budgeting, financial summaries, analytics and synchronization features.': 'ખર્ચનો હિસાબ, બજેટ, નાણાકીય સારાંશ, વિશ્લેષણ અને સમન્વયન જેવી સુવિધાઓ આપવા માટે માહિતીનો ઉપયોગ થાય છે.',
  'we use available authentication and database security controls. however, no online service or electronic storage method can guarantee absolute security.': 'અમે ઉપલબ્ધ ઓળખ ચકાસણી અને ડેટાબેઝ સુરક્ષા નિયંત્રણોનો ઉપયોગ કરીએ છીએ. તેમ છતાં, કોઈ ઑનલાઇન સેવા કે ઇલેક્ટ્રોનિક સંગ્રહ સંપૂર્ણ સુરક્ષાની ખાતરી આપી શકતો નથી.',
  'keep your login credentials private. use a secure device and avoid entering passwords or other highly sensitive information into expense descriptions.': 'તમારી પ્રવેશ વિગતો ખાનગી રાખો. સુરક્ષિત ઉપકરણ વાપરો અને ખર્ચની વિગતોમાં પાસવર્ડ કે અન્ય અતિ સંવેદનશીલ માહિતી ન લખો.',
  'expensenest relies on services such as supabase for authentication and cloud functionality and vercel for website hosting and analytics. their own privacy policies may also apply.': 'ઓળખ ચકાસણી અને ક્લાઉડ સુવિધાઓ માટે ખર્ચનેસ્ટ સુપાબેઝ જેવી સેવાઓ અને વેબસાઇટ હોસ્ટિંગ તથા વિશ્લેષણ માટે વર્સેલનો ઉપયોગ કરે છે. આ સેવાઓની પોતાની ગોપનીયતા નીતિઓ પણ લાગુ પડી શકે છે.',
  'for questions about this policy, contact us at:': 'આ નીતિ વિશે પ્રશ્નો હોય તો અહીં સંપર્ક કરો:',
  'expense nest is a personal expense management platform designed to help people organize their income, expenses, budgets and savings goals in one place.': 'ખર્ચનેસ્ટ એ આવક, ખર્ચ, બજેટ અને બચતના લક્ષ્યોને એક જ જગ્યાએ વ્યવસ્થિત કરવામાં મદદ કરતું વ્યક્તિગત નાણાં વ્યવસ્થાપન પ્લેટફોર્મ છે.',
  'to make everyday money management easier through simple, accessible and useful tools.': 'સરળ, સૌને ઉપયોગી અને સરળતાથી પહોંચે એવા સાધનો દ્વારા રોજિંદા નાણાં વ્યવસ્થાપન સરળ બનાવવું.',
  'to help people build better financial awareness and make more informed everyday decisions.': 'લોકોને નાણાં અંગે વધુ સમજ કેળવવામાં અને રોજિંદા નિર્ણયો વધુ જાણકારીથી લેવામાં મદદ કરવી.',
  'for questions, feedback or technical support, you can reach expensenest through email.': 'પ્રશ્નો, પ્રતિસાદ કે તકનીકી મદદ માટે તમે ઇમેઇલ દ્વારા ખર્ચનેસ્ટનો સંપર્ક કરી શકો છો.',
  'please include a short description of your question so we can understand how to help.': 'તમારા પ્રશ્નની ટૂંકી વિગતો આપશો, જેથી અમે યોગ્ય મદદ કરી શકીએ.',
  'your suggestions can help us improve expensenest and make money management easier for everyone.': 'તમારા સૂચનો ખર્ચનેસ્ટને વધુ સારું બનાવવામાં અને સૌ માટે નાણાં સંભાળવાનું સરળ બનાવવામાં મદદરૂપ થશે.',
  'the page you are looking for does not exist.': 'તમે શોધી રહ્યાં છો તે પાનું ઉપલબ્ધ નથી.',
  'keep track of daily income and expenses.': 'રોજની આવક અને ખર્ચનો હિસાબ રાખો.',
  'organize transactions across multiple accounts.': 'અનેક ખાતાઓના વ્યવહારો વ્યવસ્થિત કરો.',
  'set monthly and category-wise budgets.': 'માસિક અને શ્રેણી પ્રમાણે બજેટ નક્કી કરો.',
  'keep an eye on your savings goals.': 'તમારા બચતના લક્ષ્યો પર નજર રાખો.',
  'understand your spending with useful summaries.': 'ઉપયોગી સારાંશથી તમારા ખર્ચને સમજો.',
  'synchronize supported data with your account.': 'સમર્થિત માહિતી તમારા ખાતા સાથે સમન્વયિત કરો.',
  'use available import and export options.': 'ઉપલબ્ધ આયાત અને નિકાસ વિકલ્પો વાપરો.',
  'access the platform on supported mobile devices.': 'સમર્થિત મોબાઇલ ઉપકરણો પર પ્લેટફોર્મ વાપરો.',
  'review, respond in the app, and keep each submission up to date.': 'પ્રતિસાદની સમીક્ષા કરો, એપમાં જવાબ આપો અને દરેક વિનંતીની સ્થિતિ નવી રાખો.',
  'server-side aggregates. no individual transaction details are returned.': 'સર્વર પર ગણાયેલા કુલ આંકડા. કોઈ વ્યક્તિગત વ્યવહારની વિગતો મળતી નથી.',
  'counts and timestamps only. transaction details remain private.': 'ફક્ત ગણતરી અને સમયની માહિતી. વ્યવહારની વિગતો ખાનગી રહે છે.',
  'counts reflect the records currently available to this dashboard.': 'આ ડેશબોર્ડમાં હાલ ઉપલબ્ધ નોંધો પ્રમાણે ગણતરી દર્શાવાય છે.',
  'the newest accounts returned by the admin service.': 'સંચાલક સેવામાંથી મળેલા તાજેતરના ખાતાઓ.',
  'monthly registrations from user records returned by the admin service.': 'સંચાલક સેવા દ્વારા મળેલી વપરાશકર્તા નોંધોમાંથી માસિક નવી નોંધણીઓ.',
  'monthly user registrations for the last six months': 'છેલ્લા છ મહિનાની માસિક વપરાશકર્તા નોંધણીઓ',
  'real activity from your database': 'તમારા ડેટાબેઝની વાસ્તવિક પ્રવૃત્તિ',
  'tracking begins after the analytics update is deployed.': 'વિશ્લેષણનું અપડેટ લાગુ થયા પછી નોંધણી શરૂ થશે.',
  'these preferences are shared across the user screen and the rest of expensenest.': 'આ પસંદગીઓ વપરાશકર્તા પેનલ અને ખર્ચનેસ્ટના અન્ય વિભાગોમાં પણ લાગુ પડે છે.',
  'settings are saved to this account and shared with the user screen.': 'સેટિંગ્સ આ ખાતામાં સાચવાય છે અને વપરાશકર્તા પેનલ સાથે વહેંચાય છે.',
  'mask money amounts across the user panel and family views. exports keep full values.': 'વપરાશકર્તા પેનલ અને પરિવારના દૃશ્યોમાં રકમ છુપાવો. નિકાસમાં સંપૂર્ણ રકમ રહેશે.',
  'updates amount labels throughout the user screen.': 'વપરાશકર્તા પેનલમાં રકમનું પ્રદર્શન બદલે છે.',
  'updates dates in transactions, reports, activity and account details.': 'વ્યવહારો, અહેવાલો, પ્રવૃત્તિ અને ખાતાની વિગતોમાં તારીખ બદલે છે.',
  'changes the weekday order in the spending calendar.': 'ખર્ચના કૅલેન્ડરમાં અઠવાડિયાના દિવસોનો ક્રમ બદલે છે.',
  'changes the currency symbol and number format only; it does not convert amounts using exchange rates.': 'ફક્ત ચલણનું ચિહ્ન અને આંકડાનું સ્વરૂપ બદલે છે; વિનિમય દરથી રકમનું રૂપાંતર થતું નથી.',
  'choose how much content fits on each screen.': 'દરેક સ્ક્રીન પર કેટલી માહિતી દેખાય તે પસંદ કરો.',
  'choose how dates appear across transactions, reports, activity and family activity.': 'વ્યવહારો, અહેવાલો અને પ્રવૃત્તિમાં તારીખ કેવી દેખાય તે પસંદ કરો.',
  'respect system accessibility settings or reduce movement throughout expensenest.': 'ઉપકરણની સુલભતા પસંદગી અનુસરો અથવા ખર્ચનેસ્ટમાં એનિમેશન ઘટાડો.',
  'blocking an account prevents new sign-ins and protects its synced finance, family, and feedback data. an open page locks within 30 seconds; data already displayed may remain visible until then.': 'ખાતા પર પ્રતિબંધ મૂકવાથી નવી પ્રવેશ વિનંતીઓ અટકે છે અને સમન્વયિત નાણાકીય, પરિવાર તથા પ્રતિસાદની માહિતી સુરક્ષિત રહે છે. ખુલેલું પાનું ૩૦ સેકન્ડમાં બંધ થશે; ત્યાં સુધી પહેલેથી દેખાતી માહિતી દેખાઈ શકે છે.',
  'you cannot change access for your own admin account.': 'તમે તમારા પોતાના સંચાલક ખાતાનો પ્રવેશ બદલી શકતા નથી.',
  'user submissions will appear here when they send feedback from the app or contact page.': 'વપરાશકર્તાઓ એપ અથવા સંપર્ક પાનામાંથી પ્રતિસાદ મોકલશે ત્યારે તે અહીં દેખાશે.',
  'only you can see your submissions and replies in your account.': 'તમારા ખાતામાં તમારા પ્રતિસાદ અને જવાબો ફક્ત તમે જ જોઈ શકો છો.',
  'your submissions and team replies will appear here.': 'તમારા મોકલેલા પ્રતિસાદ અને ટીમના જવાબો અહીં દેખાશે.',
  'your feedback has been sent. you can follow its status and replies below.': 'તમારો પ્રતિસાદ મોકલાયો છે. તેની સ્થિતિ અને જવાબો નીચે જોઈ શકો છો.',
  'your message is visible to the expensenest support team and to you. avoid including passwords or bank details.': 'તમારો સંદેશ ખર્ચનેસ્ટ સહાય ટીમ અને તમને દેખાશે. પાસવર્ડ કે બેંકની વિગતો ન લખશો.',
  'only this signed-in account can read or clear this history. event records omit amounts and descriptions.': 'આ ઇતિહાસ ફક્ત આ પ્રવેશ કરેલા ખાતામાં જોઈ અથવા કાઢી શકાય છે. પ્રવૃત્તિ નોંધોમાં રકમ અને વિગતો રાખવામાં આવતી નથી.',
  'transactions, budgets and other important changes are recorded without storing transaction details.': 'વ્યવહારોની વિગતો સંગ્રહ્યા વિના વ્યવહારો, બજેટ અને અન્ય મહત્વના ફેરફારો નોંધાય છે.',
  'your recent account changes, kept private to your signed-in account.': 'તમારા તાજેતરના ખાતા ફેરફારો, જે ફક્ત તમારા પ્રવેશ કરેલા ખાતામાં ખાનગી રહે છે.',
  'clear your activity history? this does not delete transactions or other expensenest data.': 'તમારો પ્રવૃત્તિ ઇતિહાસ કાઢી નાખવો છે? તેનાથી વ્યવહારો કે ખર્ચનેસ્ટનો અન્ય ડેટા કાઢી નાખવામાં નહીં આવે.',
  'clear your activity history? this does not delete transactions or other expense nest data.': 'તમારો પ્રવૃત્તિ ઇતિહાસ કાઢી નાખવો છે? તેનાથી વ્યવહારો કે ખર્ચનેસ્ટની અન્ય માહિતી કાઢી નાખવામાં નહીં આવે.',
  'are you sure you want to delete this transaction?': 'શું તમે આ વ્યવહાર કાઢી નાખવા માંગો છો?',
  'delete this savings goal? its saved progress will be removed.': 'બચતનો આ લક્ષ્ય કાઢી નાખવો છે? તેમાં સાચવેલી પ્રગતિ પણ દૂર થશે.',
  'choose two different accounts for the transfer.': 'નાણાં મોકલવા માટે બે અલગ ખાતાં પસંદ કરો.',
  'choose a day on the calendar to see its income, spending and transactions here.': 'આવક, ખર્ચ અને વ્યવહારો અહીં જોવા માટે કૅલેન્ડરમાં કોઈ દિવસ પસંદ કરો.',
  'tap any day to preview activity and filter transactions below.': 'પ્રવૃત્તિ જોવા અને નીચેના વ્યવહારો ગાળવા માટે કોઈ દિવસ પસંદ કરો.',
  'this pdf is a readable archive. use the expensenest json backup file to restore data in the app.': 'આ PDF વાંચી શકાય તેવી નકલ છે. એપમાં માહિતી પુનઃસ્થાપિત કરવા ખર્ચનેસ્ટની JSON બૅકઅપ ફાઇલ વાપરો.',
  'feedback conversations are not set up yet. run supabase/feedback_conversations.sql in the supabase sql editor.': 'પ્રતિસાદ સંવાદ હજી ગોઠવાયા નથી. સુપાબેઝના SQL સંપાદકમાં supabase/feedback_conversations.sql ચલાવો.',
  'apply the activity log sql migrations, then refresh this section.': 'પ્રવૃત્તિ નોંધ માટેની SQL ગોઠવણો લાગુ કરો, પછી આ વિભાગ ફરી ખોલો.',
  'apply the admin analytics sql migration, then refresh this page.': 'સંચાલક વિશ્લેષણની SQL ગોઠવણ લાગુ કરો, પછી આ પાનું ફરી ખોલો.',
  'run the updated supabase/admin_analytics.sql and deploy the app to start collecting daily activity.': 'દૈનિક પ્રવૃત્તિ નોંધવા માટે અપડેટ કરેલી supabase/admin_analytics.sql ચલાવો અને એપ ફરી પ્રકાશિત કરો.',
  'no members found.': 'કોઈ સભ્ય મળ્યો નથી.',
  'no transactions added yet.': 'હજુ કોઈ વ્યવહાર ઉમેરાયો નથી.',
  'no activity matches these filters': 'આ ગાળણીઓ સાથે મેળ ખાતી પ્રવૃત્તિ નથી',
  'no matching feedback': 'મેળ ખાતો પ્રતિસાદ મળ્યો નથી',
  'no feedback yet': 'હજુ કોઈ પ્રતિસાદ નથી',
  'no pending replies': 'જવાબ આપવાના સંદેશા નથી',
  'no submissions are waiting for a response.': 'જવાબની રાહમાં કોઈ પ્રતિસાદ નથી.',
  'try another email, category, or search phrase.': 'બીજું ઇમેઇલ, શ્રેણી અથવા શોધ શબ્દ અજમાવો.',
  'try another status or search phrase.': 'બીજી સ્થિતિ અથવા શોધ શબ્દ અજમાવો.',
  'try a longer date range or clear your search.': 'તારીખની મોટી અવધિ પસંદ કરો અથવા શોધ સાફ કરો.',
  'the support team can now see it.': 'હવે સહાય ટીમ આ જવાબ જોઈ શકે છે.',
  'reply sent. the support team can now see it.': 'જવાબ મોકલાયો. હવે સહાય ટીમ તેને જોઈ શકે છે.',
  'you can edit only your own transactions.': 'તમે ફક્ત તમારા પોતાના વ્યવહારોમાં ફેરફાર કરી શકો છો.',
  'you have successfully joined the family!': 'તમે સફળતાપૂર્વક પરિવારમાં જોડાયા!',
  'invitation created successfully.': 'આમંત્રણ સફળતાપૂર્વક બનાવાયું.',
  'invitation code copied.': 'આમંત્રણ કોડ નકલ થયો.',
  'transaction added successfully!': 'વ્યવહાર સફળતાપૂર્વક ઉમેરાયો!',
  'transaction updated successfully!': 'વ્યવહાર સફળતાપૂર્વક સુધારાયો!',
  'transaction deleted successfully!': 'વ્યવહાર સફળતાપૂર્વક કાઢી નાખ્યો!',
  'family created successfully!': 'પરિવાર સફળતાપૂર્વક બનાવાયો!',
  'please enter a valid amount.': 'કૃપા કરીને માન્ય રકમ દાખલ કરો.',
  'please enter a category.': 'કૃપા કરીને શ્રેણી દાખલ કરો.',
  'please enter a family name.': 'કૃપા કરીને પરિવારનું નામ દાખલ કરો.',
  'please enter the invited email.': 'કૃપા કરીને આમંત્રિત વ્યક્તિનું ઇમેઇલ દાખલ કરો.',
  'please enter the invitation code.': 'કૃપા કરીને આમંત્રણ કોડ દાખલ કરો.',
  'please select a family first.': 'પહેલાં પરિવાર પસંદ કરો.',
  'please write between 10 and 2,000 characters.': 'કૃપા કરીને ૧૦થી ૨,૦૦૦ અક્ષરોમાં લખો.',
  'sign in before sending feedback.': 'પ્રતિસાદ મોકલતા પહેલાં પ્રવેશ કરો.',
  'sign in to view your feedback and any replies.': 'તમારો પ્રતિસાદ અને જવાબો જોવા માટે પ્રવેશ કરો.',
  'sign in to keep your activity history with your account.': 'પ્રવૃત્તિ ઇતિહાસ ખાતામાં સાચવવા માટે પ્રવેશ કરો.',
  'send a note to the expensenest team and follow its progress here.': 'ખર્ચનેસ્ટ ટીમને સંદેશ મોકલો અને તેની પ્રગતિ અહીં જુઓ.',
  'tell us what would make your experience better.': 'તમારો અનુભવ વધુ સારો બનાવવા શું કરી શકાય તે જણાવો.',
  'describe your idea or what happened…': 'તમારો વિચાર અથવા બનેલી ઘટના વિશે લખો…',
  'add details or answer the support team…': 'વધુ વિગતો ઉમેરો અથવા સહાય ટીમને જવાબ આપો…',
  'please include a short description of your question so we can understand how to help.': 'કેવી રીતે મદદ કરવી તે સમજાય તે માટે કૃપા કરીને પ્રશ્નની ટૂંકી વિગતો લખો.',
  'this browser does not support desktop alerts. in-app reminders are still available.': 'આ બ્રાઉઝરમાં ડેસ્કટૉપ સૂચનાઓ ઉપલબ્ધ નથી. એપની અંદરના રિમાઇન્ડર વાપરી શકો છો.',
  'browser alerts are blocked. allow notifications for expensenest in your browser site settings.': 'બ્રાઉઝરની સૂચનાઓ બંધ છે. બ્રાઉઝરની સાઇટ સેટિંગ્સમાં ખર્ચનેસ્ટ માટે સૂચનાઓ મંજૂર કરો.',
  'browser could not show the alert. the in-app reminder is still available.': 'બ્રાઉઝર સૂચના બતાવી શક્યું નથી. એપની અંદરનું રિમાઇન્ડર ઉપલબ્ધ છે.',
  'alerts are enabled. expensenest will remind you while it is open.': 'સૂચનાઓ ચાલુ છે. ખર્ચનેસ્ટ ખુલ્લું હશે ત્યારે તમને યાદ અપાવશે.',
  'alerts were not enabled. you can still see reminders inside expensenest.': 'સૂચનાઓ ચાલુ થઈ નથી. ખર્ચનેસ્ટની અંદર રિમાઇન્ડર જોઈ શકશો.',
  'could not enable browser alerts. you can still see reminders inside expensenest.': 'બ્રાઉઝરની સૂચનાઓ ચાલુ થઈ શકી નથી. ખર્ચનેસ્ટની અંદર રિમાઇન્ડર જોઈ શકશો.',
  'upcoming recurring payment': 'આગામી આવર્તિત ચુકવણી',
  'recurring payment overdue': 'આવર્તિત ચુકવણી મુદત વટાવી ગઈ છે',
  'transaction added with a monthly schedule': 'માસિક સમયપત્રક સાથે વ્યવહાર ઉમેરાયો',
  'transaction updated successfully': 'વ્યવહાર સફળતાપૂર્વક સુધારાયો',
  'transaction added successfully': 'વ્યવહાર સફળતાપૂર્વક ઉમેરાયો',
  'transfer recorded successfully': 'નાણાંનું હસ્તાંતરણ નોંધાયું',
  'monthly budget saved': 'માસિક બજેટ સાચવાયું',
  'could not load your feedback.': 'તમારો પ્રતિસાદ લાવી શકાયો નથી.',
  'could not send feedback. please try again.': 'પ્રતિસાદ મોકલી શકાયો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
  'could not send your reply.': 'તમારો જવાબ મોકલી શકાયો નથી.',
  'could not update the conversation read status.': 'સંવાદ વાંચ્યાની સ્થિતિ સુધારી શકાય નથી.',
  'could not clear your activity history.': 'પ્રવૃત્તિ ઇતિહાસ સાફ કરી શકાયો નથી.',
  'could not load older activity.': 'જૂની પ્રવૃત્તિ લાવી શકાયી નથી.',
  'could not load your activity history.': 'તમારો પ્રવૃત્તિ ઇતિહાસ લાવી શકાયો નથી.',
  'unable to load families.': 'પરિવારો લાવી શકાયા નથી.',
  'unable to load family members.': 'પરિવારના સભ્યો લાવી શકાયા નથી.',
  'unable to load transactions.': 'વ્યવહારો લાવી શકાયા નથી.',
  'could not load older activity.': 'જૂની પ્રવૃત્તિ લાવી શકાયી નથી.',
};

Object.assign(PHRASES, {
  'language': 'ભાષા',
  'language settings': 'ભાષા સેટિંગ્સ',
  'choose your preferred language.': 'તમારી પસંદગીની ભાષા પસંદ કરો.',
  'english': 'અંગ્રેજી',
  'gujarati': 'ગુજરાતી',
  'smart money · better future': 'સમજદારીભર્યા નાણાં · ઉજ્જવળ ભવિષ્ય',
  'indian rupee': 'ભારતીય રૂપિયો',
  'indian rupees': 'ભારતીય રૂપિયા',
  'us dollar': 'અમેરિકી ડૉલર',
  'us dollars': 'અમેરિકી ડૉલર',
  'euro': 'યુરો',
  'euros': 'યુરો',
  'british pound': 'બ્રિટિશ પાઉન્ડ',
  'british pounds': 'બ્રિટિશ પાઉન્ડ',
  'uae dirham': 'યુએઈ દિરહામ',
  'pakistani rupee': 'પાકિસ્તાની રૂપિયો',
  'pakistani rupees': 'પાકિસ્તાની રૂપિયા',
  'inr · indian rupee': 'INR · ભારતીય રૂપિયો',
  'usd · us dollar': 'USD · અમેરિકી ડૉલર',
  'eur · euro': 'EUR · યુરો',
  'gbp · british pound': 'GBP · બ્રિટિશ પાઉન્ડ',
  'aed · uae dirham': 'AED · યુએઈ દિરહામ',
  'pkr · pakistani rupee': 'PKR · પાકિસ્તાની રૂપિયો',
  'regional · 21 nov 2026': 'પ્રાદેશિક · ૨૧ નવેમ્બર ૨૦૨૬',
  'dd/mm/yyyy - 21/11/2026': 'દિવસ/મહિનો/વર્ષ · ૨૧/૧૧/૨૦૨૬',
  'mm/dd/yyyy - 11/21/2026': 'મહિનો/દિવસ/વર્ષ · ૧૧/૨૧/૨૦૨૬',
  'yyyy-mm-dd - 2026-11-21': 'વર્ષ-મહિનો-દિવસ · ૨૦૨૬-૧૧-૨૧',
  'date unavailable': 'તારીખ ઉપલબ્ધ નથી',
  'date not available': 'તારીખ ઉપલબ્ધ નથી',
  'used throughout the user and admin panels.': 'વપરાશકર્તા અને સંચાલક પેનલમાં આ ભાષા વપરાશે.',
  'could not import the data.': 'માહિતી આયાત થઈ શકી નથી.',
  'could not start a fresh account.': 'નવું ખાતું શરૂ થઈ શક્યું નથી.',
  'starting fresh will clear the existing expense nest data in this browser. continue?': 'નવી શરૂઆત કરવાથી આ બ્રાઉઝરમાંનો હાલનો ExpenseNest ડેટા કાઢી નાખવામાં આવશે. આગળ વધવું છે?',
  'do you want to sign out of expense nest?': 'શું તમે ExpenseNestમાંથી બહાર નીકળવા માંગો છો?',
  'make more informed decisions': 'વધુ સારી સમજ સાથે નિર્ણયો લો',
  'manage your family\'s shared income and expenses.': 'પરિવારની આવક અને ખર્ચનું સંચાલન કરો.',
  'savings rate uses recorded income minus recorded expenses.': 'બચતનો દર નોંધાયેલી આવકમાંથી નોંધાયેલા ખર્ચ બાદ કરીને ગણવામાં આવે છે.',
  'no transactions in this month yet.': 'આ મહિને હજી સુધી કોઈ વ્યવહાર નથી.',
  'no transactions recorded on this day.': 'આ દિવસે કોઈ વ્યવહાર નોંધાયો નથી.',
  'no activity in either month': 'બંને મહિનામાં કોઈ પ્રવૃત્તિ નોંધાઈ નથી',
  'no activity last month': 'ગયા મહિને કોઈ પ્રવૃત્તિ નોંધાઈ નથી',
  'users could not load': 'વપરાશકર્તાઓની યાદી લાવી શકાયી નથી',
  'user could not load': 'વપરાશકર્તાની માહિતી લાવી શકાયી નથી',
  'the admin page could not load': 'સંચાલક પાનું ખોલી શકાયું નથી',
  'make more informed decisions.': 'વધુ સારી સમજ સાથે નિર્ણયો લો.',
  'top spending category': 'સૌથી વધુ ખર્ચની શ્રેણી',
  'no spending yet': 'હજુ સુધી કોઈ ખર્ચ નોંધાયો નથી',
  'no transactions saved.': 'કોઈ વ્યવહાર સાચવ્યો નથી.',
  'unable to load families.': 'પરિવારો લાવી શકાયા નથી.',
  'unable to load family members.': 'પરિવારના સભ્યો લાવી શકાયા નથી.',
  'unable to load transactions.': 'વ્યવહારો લાવી શકાયા નથી.',
  'dashboard loading failed.': 'ડેશબોર્ડ લાવી શકાયું નથી.',
  'an unexpected page error occurred.': 'પાનું ખોલતી વખતે અનપેક્ષિત ભૂલ થઈ.',
  'data import nahi ho saka.': 'માહિતી આયાત થઈ શકી નથી.',
  'fresh account start nahi ho saka.': 'નવું ખાતું શરૂ થઈ શક્યું નથી.',
  'start fresh karne se is browser ka existing expensenest data clear ho jayega. kya aap sure hain?': 'નવી શરૂઆત કરવાથી આ બ્રાઉઝરમાંનો હાલનો ExpenseNest ડેટા કાઢી નાખવામાં આવશે. શું તમે નિશ્ચિત છો?',
  'welcome back,': 'ફરી સ્વાગત છે,',
  'your platform,': 'તમારું પ્લેટફોર્મ,',
  'daily active accounts': 'દૈનિક સક્રિય ખાતાં',
  'daily unique accounts': 'દરરોજના અલગ ખાતાં',
  'account currently signed in to this admin portal.': 'આ સંચાલક પેનલમાં હાલમાં પ્રવેશ કરેલું ખાતું.',
  'blocking an account prevents new sign-ins and protects its synced finance, family, and feedback data. an open page locks within 30 seconds; data already displayed may remain visible until then.': 'ખાતા પર પ્રતિબંધ મૂકવાથી નવા પ્રવેશ અટકે છે અને સમન્વયિત નાણાકીય, પરિવાર અને પ્રતિસાદની માહિતી સુરક્ષિત રહે છે. ખુલ્લું પાનું ૩૦ સેકન્ડમાં લૉક થશે; ત્યાં સુધી પહેલેથી દેખાતી માહિતી દેખાઈ શકે છે.',
  'changes the currency symbol and number format only; it does not convert amounts using exchange rates.': 'આ ફેરફાર માત્ર ચલણનું ચિહ્ન અને આંકડાનું સ્વરૂપ બદલે છે; વિનિમય દર પ્રમાણે રકમનું રૂપાંતર થતું નથી.',
  'changes the weekday order in the spending calendar.': 'ખર્ચના કૅલેન્ડરમાં અઠવાડિયાના દિવસોનો ક્રમ બદલે છે.',
  'choose how much content fits on each screen.': 'દરેક સ્ક્રીન પર કેટલી સામગ્રી દેખાય તે પસંદ કરો.',
  'respect system accessibility settings or reduce movement throughout expensenest.': 'સિસ્ટમની સુલભતા સેટિંગ્સ અનુસરો અથવા ExpenseNestમાં એનિમેશન ઘટાડો.',
  'transactions, budgets and other important changes are recorded without storing transaction details.': 'વ્યવહારની વિગતો સંગ્રહ્યા વિના વ્યવહારો, બજેટ અને અન્ય મહત્વના ફેરફારો નોંધવામાં આવે છે.',
  'keep track of daily income and expenses.': 'દરરોજની આવક અને ખર્ચનો હિસાબ રાખો.',
  'organize transactions across multiple accounts.': 'અનેક ખાતાંના વ્યવહારો વ્યવસ્થિત રાખો.',
  'set monthly and category-wise budgets.': 'માસિક અને શ્રેણી પ્રમાણે બજેટ નક્કી કરો.',
  'understand your spending with useful summaries.': 'ઉપયોગી સારાંશથી તમારા ખર્ચને સમજો.',
  'workspace briefing': 'કાર્યસ્થળનો અહેવાલ',
  'a clear view of account growth, access health, and customer conversations across expensenest.': 'ExpenseNestમાં ખાતાની વૃદ્ધિ, પ્રવેશની સ્થિતિ અને ગ્રાહક સંવાદની સ્પષ્ટ ઝલક.',
  'review accounts': 'ખાતાઓ તપાસો',
  'registered accounts in this workspace': 'આ કાર્યસ્થળમાં નોંધાયેલા ખાતાં',
  'accounts created this month': 'આ મહિને બનાવેલાં ખાતાં',
  'restricted accounts': 'પ્રતિબંધિત ખાતાં',
  'accounts with access currently paused': 'હાલમાં પ્રવેશ રોકાયેલાં ખાતાં',
  'feedback to review': 'સમીક્ષા માટેનો પ્રતિસાદ',
  'unread customer messages': 'ન વાંચેલા ગ્રાહક સંદેશા',
  'account momentum': 'ખાતાની વૃદ્ધિ',
  'new accounts by month, based on records returned by the admin service.': 'સંચાલક સેવા દ્વારા મળેલી નોંધો મુજબ મહિને નવા ખાતાં.',
  'workspace pulse': 'કાર્યસ્થળની પ્રવૃત્તિ',
  'latest account, settings, and support events.': 'ખાતાં, સેટિંગ્સ અને સહાયની તાજેતરની ઘટનાઓ.',
  'view activity': 'પ્રવૃત્તિ જુઓ',
  'loading activity': 'પ્રવૃત્તિ લવાઈ રહી છે',
  'activity log is not available yet.': 'પ્રવૃત્તિ નોંધ હજી ઉપલબ્ધ નથી.',
  'no recent activity to show.': 'બતાવવા માટે તાજેતરની પ્રવૃત્તિ નથી.',
});

const WORDS = {
  expensenest: 'ખર્ચનેસ્ટ', api: 'એપીઆઈ', url: 'યુઆરએલ', uuid: 'યુનિક આઈડી',
  a: 'એક', an: 'એક', the: '', and: 'અને', or: 'અથવા', of: 'ના', to: 'માટે', in: 'માં', on: 'પર', for: 'માટે', from: 'તરફથી', with: 'સાથે', by: 'દ્વારા', at: 'પર', as: 'રૂપે', your: 'તમારું', you: 'તમે', we: 'અમે', our: 'અમારું', their: 'તેમના', its: 'તેનું', this: 'આ', these: 'આ', that: 'તે', all: 'બધા', any: 'કોઈપણ', no: 'નથી', not: 'નહીં', only: 'ફક્ત', each: 'દરેક', more: 'વધુ', less: 'ઓછું', other: 'અન્ય', here: 'અહીં', below: 'નીચે', above: 'ઉપર', now: 'હવે', yet: 'હજુ', still: 'હજુ પણ', next: 'આગળનું', previous: 'પહેલાનું', last: 'છેલ્લા', first: 'પ્રથમ', older: 'જૂનું', latest: 'તાજેતરનું', recent: 'તાજેતરનું', daily: 'દૈનિક', monthly: 'માસિક', week: 'અઠવાડિયું', sunday: 'રવિવાર', monday: 'સોમવાર', saturday: 'શનિવાર', day: 'દિવસ', days: 'દિવસો', month: 'મહિનો', months: 'મહિનાઓ', year: 'વર્ષ', years: 'વર્ષો', today: 'આજે', yesterday: 'ગઈકાલે', date: 'તારીખ', time: 'સમય', period: 'સમયગાળો', range: 'અવધિ',
  user: 'વપરાશકર્તા', users: 'વપરાશકર્તાઓ', admin: 'સંચાલક', administrator: 'સંચાલક', admins: 'સંચાલકો', console: 'નિયંત્રણ પેનલ', workspace: 'કાર્યસ્થળ', overview: 'ઝાંખી', home: 'મુખ્ય પાનું', dashboard: 'ડેશબોર્ડ', panel: 'પેનલ', account: 'ખાતું', accounts: 'ખાતાં', member: 'સભ્ય', members: 'સભ્યો', family: 'પરિવાર', families: 'પરિવારો', owner: 'માલિક', former: 'ભૂતપૂર્વ', status: 'સ્થિતિ', access: 'પ્રવેશ', blocked: 'પ્રતિબંધિત', suspended: 'સ્થગિત', active: 'સક્રિય', inactive: 'નિષ્ક્રિય', approved: 'મંજૂર', registered: 'નોંધાયેલ', registration: 'નોંધણી', health: 'સ્વાસ્થ્ય', profile: 'પ્રોફાઇલ', details: 'વિગતો', directory: 'યાદી', management: 'વ્યવસ્થાપન',
  expense: 'ખર્ચ', expenses: 'ખર્ચ', income: 'આવક', transaction: 'વ્યવહાર', transactions: 'વ્યવહારો', transfer: 'હસ્તાંતરણ', recurring: 'આવર્તિત', schedule: 'સમયપત્રક', schedules: 'સમયપત્રકો', budget: 'બજેટ', budgets: 'બજેટ', savings: 'બચત', goal: 'લક્ષ્ય', goals: 'લક્ષ્યો', amount: 'રકમ', amounts: 'રકમો', balance: 'બાકી રકમ', spent: 'ખર્ચાયું', spending: 'ખર્ચ', category: 'શ્રેણી', categories: 'શ્રેણીઓ', food: 'ખોરાક', salary: 'પગાર', rent: 'ભાડું', cash: 'રોકડ', bank: 'બેંક', accountname: 'ખાતાનું નામ', money: 'નાણાં', rupee: 'રૂપિયો',
  activity: 'પ્રવૃત્તિ', history: 'ઇતિહાસ', analytics: 'વિશ્લેષણ', report: 'અહેવાલ', reports: 'અહેવાલો', trend: 'વલણ', trends: 'વલણો', chart: 'આલેખ', calendar: 'કૅલેન્ડર', forecast: 'આગાહી', feedback: 'પ્રતિસાદ', reply: 'જવાબ', replies: 'જવાબો', response: 'પ્રતિસાદ', message: 'સંદેશ', messages: 'સંદેશાઓ', conversation: 'સંવાદ', support: 'સહાય', inbox: 'ઇનબૉક્સ', submission: 'રજૂઆત', submissions: 'રજૂઆતો', idea: 'વિચાર', bug: 'ખામી', general: 'સામાન્ય', urgent: 'તાત્કાલિક', priority: 'પ્રાથમિકતા', high: 'ઊંચી', low: 'નીચી', normal: 'સામાન્ય', new: 'નવું', unread: 'વાંચ્યા વગરનું', read: 'વાંચેલું', resolved: 'ઉકેલાયું', review: 'સમીક્ષા', assigned: 'સોંપાયેલું', unassigned: 'સોંપ્યું નથી',
  settings: 'સેટિંગ્સ', setting: 'સેટિંગ', preferences: 'પસંદગીઓ', appearance: 'દેખાવ', theme: 'થીમ', dark: 'ડાર્ક', light: 'લાઇટ', privacy: 'ગોપનીયતા', hidden: 'છુપાવેલું', visible: 'દેખાતું', currency: 'ચલણ', dateformat: 'તારીખનું સ્વરૂપ', format: 'સ્વરૂપ', layout: 'રચના', density: 'ઘનતા', comfortable: 'આરામદાયક', compact: 'સઘન', motion: 'હલનચલન', animation: 'એનિમેશન', system: 'સિસ્ટમ', device: 'ઉપકરણ', accessibility: 'સુલભતા', language: 'ભાષા',
  search: 'શોધો', filter: 'ગાળો', filters: 'ગાળણીઓ', clear: 'સાફ કરો', refresh: 'ફરી લાવો', reload: 'ફરી ખોલો', load: 'લાવો', loading: 'લવાઈ રહ્યું છે', loaded: 'લવાયું', older: 'જૂનું', export: 'નિકાસ', import: 'આયાત', backup: 'બૅકઅપ', restore: 'પુનઃસ્થાપિત કરો', save: 'સાચવો', saved: 'સાચવ્યું', saving: 'સચવાઈ રહ્યું છે', reset: 'ફરી ગોઠવો', create: 'બનાવો', creating: 'બનાવાઈ રહ્યું છે', add: 'ઉમેરો', adding: 'ઉમેરાઈ રહ્યું છે', edit: 'ફેરફાર કરો', update: 'સુધારો', updating: 'સુધારાઈ રહ્યું છે', delete: 'કાઢી નાખો', remove: 'દૂર કરો', cancel: 'રદ કરો', done: 'પૂર્ણ', close: 'બંધ કરો', view: 'જુઓ', show: 'બતાવો', hide: 'છુપાવો', select: 'પસંદ કરો', choose: 'પસંદ કરો', enter: 'દાખલ કરો', paste: 'ચોંટાડો', copy: 'નકલ કરો', send: 'મોકલો', sending: 'મોકલાઈ રહ્યું છે', submit: 'રજૂ કરો', manage: 'સંચાળો', browse: 'શોધો', jump: 'જાઓ', return: 'પાછા જાઓ', back: 'પાછા', sign: 'પ્રવેશ', login: 'પ્રવેશ', logout: 'બહાર નીકળો', password: 'પાસવર્ડ', email: 'ઇમેઇલ', address: 'સરનામું', invitation: 'આમંત્રણ', invite: 'આમંત્રિત કરો', code: 'કોડ', copied: 'નકલ થયું',
  successful: 'સફળતાપૂર્વક', successfully: 'સફળતાપૂર્વક', success: 'સફળતા', error: 'ભૂલ', failed: 'નિષ્ફળ', failure: 'નિષ્ફળતા', unable: 'શક્ય નથી', could: 'શક્યા', unexpected: 'અણધારી', please: 'કૃપા કરીને', try: 'પ્રયાસ', again: 'ફરી', check: 'ચકાસો', verifying: 'ચકાસાઈ રહ્યું છે', verify: 'ચકાસો', waiting: 'રાહ જોઈ રહ્યું છે', welcome: 'સ્વાગત', privacy: 'ગોપનીયતા', protected: 'સુરક્ષિત', protect: 'સુરક્ષા', secure: 'સુરક્ષિત', privately: 'ખાનગી રીતે', private: 'ખાનગી', available: 'ઉપલબ્ધ', unavailable: 'ઉપલબ્ધ નથી', matching: 'મેળ ખાતું', match: 'મેળ', shown: 'બતાવ્યું', total: 'કુલ', count: 'ગણતરી', counts: 'ગણતરીઓ', row: 'પંક્તિ', rows: 'પંક્તિઓ', page: 'પાનું', pages: 'પાનાં', result: 'પરિણામ', results: 'પરિણામો', all: 'બધા', active: 'સક્રિય', new: 'નવું', open: 'ખોલો', closed: 'બંધ', enabled: 'ચાલુ', disabled: 'બંધ', blocked: 'પ્રતિબંધિત', paused: 'થોભાવ્યું', continue: 'ચાલુ રાખો', action: 'કાર્ય', actions: 'કાર્યો', button: 'બટન', status: 'સ્થિતિ', setting: 'સેટિંગ', feature: 'સુવિધા', platform: 'પ્લેટફોર્મ', application: 'એપ', browser: 'બ્રાઉઝર', desktop: 'ડેસ્કટૉપ', mobile: 'મોબાઇલ', website: 'વેબસાઇટ', service: 'સેવા', services: 'સેવાઓ', database: 'ડેટાબેઝ', cloud: 'ક્લાઉડ', sync: 'સમન્વયન', synchronization: 'સમન્વયન', analytics: 'વિશ્લેષણ', data: 'માહિતી', information: 'માહિતી', settings: 'સેટિંગ્સ', screen: 'સ્ક્રીન', userpanel: 'વપરાશકર્તા પેનલ', user: 'વપરાશકર્તા', panel: 'પેનલ',
  emailaddress: 'ઇમેઇલ સરનામું', title: 'શીર્ષક', description: 'વિગત', note: 'નોંધ', notes: 'નોંધો', name: 'નામ', label: 'લેબલ', type: 'પ્રકાર', amount: 'રકમ', date: 'તારીખ', deadline: 'અંતિમ તારીખ', month: 'મહિનો', day: 'દિવસ', week: 'અઠવાડિયું', year: 'વર્ષ', format: 'સ્વરૂપ', regional: 'પ્રાદેશિક', default: 'મૂળભૂત', custom: 'પસંદગીનું', all: 'બધા', any: 'કોઈપણ', none: 'કંઈ નહીં', other: 'અન્ય', unknown: 'અજ્ઞાત', assigned: 'સોંપાયેલું', mine: 'મારું', yourself: 'તમે પોતે', yourself: 'તમે પોતે',
  hide: 'છુપાવો', show: 'બતાવો', read: 'વાંચેલું', clear: 'સાફ કરો', remove: 'દૂર કરો', delete: 'કાઢી નાખો', copy: 'નકલ કરો', email: 'ઇમેઇલ', id: 'આઈડી', csv: 'સી.એસ.વી.', pdf: 'પી.ડી.એફ.', json: 'જેસન', sql: 'એસ.ક્યુ.એલ.', supabase: 'સુપાબેઝ', vercel: 'વર્સેલ', generated: 'બનાવ્યું', updated: 'સુધાર્યું', created: 'બનાવ્યું', submitted: 'મોકલ્યું', recorded: 'નોંધ્યું', expired: 'સમાપ્ત', overdue: 'મુદત વટાવ્યું', due: 'બાકી', today: 'આજે', upcoming: 'આગામી', estimate: 'અંદાજ', estimated: 'અંદાજિત', expected: 'અપેક્ષિત', higher: 'વધુ', lower: 'ઓછું', than: 'કરતાં', compared: 'સરખામણી', versus: 'વિરુદ્ધ', percent: 'ટકા', used: 'વપરાયું', sent: 'મોકલ્યું', received: 'મળ્યું', added: 'ઉમેર્યું', removed: 'દૂર કર્યું', follow: 'અનુસરો', keep: 'જાળવો', keeptrack: 'હિસાબ રાખો', start: 'શરૂ કરો', starts: 'શરૂ થાય છે', fresh: 'નવી', existing: 'હાલનું', account: 'ખાતું', freshstart: 'નવી શરૂઆત', exportresults: 'પરિણામોની નિકાસ',
  "you're": 'તમે', "haven't": 'નથી', "don't": 'નહીં', "doesn't": 'નથી', cannot: 'શકતા નથી', "can't": 'શકતા નથી', "won't": 'નહીં', is: 'છે', are: 'છે', am: 'છું', was: 'હતું', were: 'હતા', be: 'હોવું', has: 'છે', have: 'છે', had: 'હતું', will: 'શે', can: 'શકે', may: 'શકે', do: 'કરો', does: 'કરે', did: 'કર્યું', it: 'તે', its: 'તેનું', me: 'મને', my: 'મારું', you: 'તમે', your: 'તમારું', we: 'અમે', they: 'તેઓ', their: 'તેમનું', someone: 'કોઈ વ્યક્તિ', familyname: 'પરિવારનું નામ', member: 'સભ્ય', members: 'સભ્યો', who: 'જે', what: 'શું', how: 'કેવી રીતે', when: 'ક્યારે', where: 'ક્યાં', why: 'શા માટે', up: 'ઉપર', down: 'નીચે', in: 'માં', out: 'બહાર', from: 'માંથી', to: 'માટે', with: 'સાથે', without: 'વિના', into: 'માં', across: 'સમગ્ર', throughout: 'સમગ્ર', while: 'જ્યારે', after: 'પછી', before: 'પહેલાં', until: 'સુધી', then: 'પછી', because: 'કારણ કે', if: 'જો', or: 'અથવા', and: 'અને', but: 'પરંતુ',
};

Object.assign(WORDS, {
  activity: 'પ્રવૃત્તિ', activities: 'પ્રવૃત્તિઓ', sharing: 'વહેંચણી', share: 'ભાગ', shared: 'સામૂહિક',
  between: 'વચ્ચે', quick: 'ઝડપી', actions: 'કાર્યો', session: 'સત્ર', sessions: 'સત્રો', decision: 'નિર્ણય',
  decisions: 'નિર્ણયો', update: 'સુધારો', updates: 'સુધારા', updated: 'સુધારાયું', changing: 'બદલાઈ રહ્યું છે',
  change: 'ફેરફાર', changes: 'ફેરફારો', applied: 'લાગુ થયું', across: 'સમગ્ર', account: 'ખાતું', accounts: 'ખાતાં',
  registration: 'નોંધણી', registrations: 'નોંધણીઓ', registrationdate: 'નોંધણીની તારીખ', returning: 'પાછા આવતા',
  return: 'પાછા આવો', payments: 'ચુકવણીઓ', payment: 'ચુકવણી', reminder: 'યાદ અપાવનાર સૂચના', reminders: 'યાદ અપાવતી સૂચનાઓ',
  upcoming: 'આગામી', overdue: 'મુદત વટાવી ગયેલું', contribution: 'યોગદાન', contributions: 'યોગદાન', wallet: 'નાણાં ખાતું',
  wallets: 'નાણાં ખાતાં', privacy: 'ગોપનીયતા', permission: 'પરવાનગી', notifications: 'સૂચનાઓ', notification: 'સૂચના',
  enabled: 'ચાલુ', disabled: 'બંધ', supported: 'સમર્થિત', support: 'સહાય', idea: 'વિચાર', ideas: 'વિચારો',
  general: 'સામાન્ય', specific: 'ચોક્કસ', query: 'શોધ', matching: 'મેળ ખાતું', match: 'મેળ', matches: 'મેળ ખાય છે',
  minimum: 'ઓછામાં ઓછી', maximum: 'વધુમાં વધુ', minimumamount: 'ઓછામાં ઓછી રકમ', maximumamount: 'વધુમાં વધુ રકમ',
  enter: 'દાખલ કરો', entered: 'દાખલ કરેલું', entries: 'નોંધો', entry: 'નોંધ', target: 'લક્ષ્ય', targets: 'લક્ષ્યો',
  deadline: 'અંતિમ તારીખ', estimate: 'અંદાજ', estimateD: 'અંદાજિત', monthend: 'મહિનાનો અંત', forecast: 'આગાહી',
  forecasted: 'આગાહી કરેલું', comparisons: 'સરખામણીઓ', compared: 'સરખામણીમાં', growth: 'વૃદ્ધિ', increase: 'વધારો',
  decrease: 'ઘટાડો', percentage: 'ટકાવારી', percentagepoints: 'ટકાવારીના અંકો', remaining: 'બાકી', remainder: 'બાકી રકમ',
  amount: 'રકમ', amounts: 'રકમો', average: 'સરેરાશ', highest: 'સૌથી વધુ', lowest: 'સૌથી ઓછું', largest: 'સૌથી મોટું',
  smallest: 'સૌથી નાનું', categorywise: 'શ્રેણી પ્રમાણે', categorized: 'શ્રેણીબદ્ધ', categories: 'શ્રેણીઓ',
  breakdown: 'વિગતવાર વહેંચણી', insights: 'મહત્વની જાણકારી', insight: 'જાણકારી', metric: 'માપદંડ', metrics: 'માપદંડો',
  results: 'પરિણામો', result: 'પરિણામ', summary: 'સારાંશ', summaries: 'સારાંશો', services: 'સેવાઓ', service: 'સેવા',
  server: 'સર્વર', platform: 'પ્લેટફોર્મ', system: 'સિસ્ટમ', global: 'વૈશ્વિક', protected: 'સુરક્ષિત', protection: 'સુરક્ષા',
  organization: 'વ્યવસ્થા', organized: 'વ્યવસ્થિત', organizedly: 'વ્યવસ્થિત રીતે', directory: 'યાદી', profile: 'પ્રોફાઇલ',
  registration: 'નોંધણી', registered: 'નોંધાયેલ', suspended: 'સ્થગિત', suspension: 'સ્થગન', indefinitely: 'અનિશ્ચિત સમય માટે',
  allowed: 'મંજૂર', blocked: 'પ્રતિબંધિત', restrict: 'મર્યાદિત કરો', restricted: 'મર્યાદિત', reactivate: 'ફરી સક્રિય કરો',
  restore: 'પુનઃસ્થાપિત કરો', restored: 'પુનઃસ્થાપિત થયું', suspend: 'સ્થગિત કરો', suspended: 'સ્થગિત', block: 'અટકાવો',
  unblock: 'પ્રતિબંધ દૂર કરો', detail: 'વિગત', details: 'વિગતો', accounthealth: 'ખાતાની સ્થિતિ', timestamp: 'સમયમુદ્રા',
  timestampS: 'સમયમુદ્રાઓ', counts: 'ગણતરી', count: 'ગણતરી', individual: 'વ્યક્તિગત', private: 'ખાનગી', privately: 'ખાનગી રીતે',
  accessible: 'સુલભ', accessibility: 'સુલભતા', accessible: 'સુલભ', comfortable: 'આરામદાયક', normal: 'સામાન્ય', compact: 'સઘન',
  reduced: 'ઘટાડેલું', reduce: 'ઘટાડો', motion: 'હલનચલન', animation: 'એનિમેશન', animations: 'એનિમેશન', preference: 'પસંદગી',
  preferences: 'પસંદગીઓ', density: 'ઘનતા', appearance: 'દેખાવ', theme: 'થીમ', currency: 'ચલણ', regional: 'પ્રાદેશિક',
  format: 'સ્વરૂપ', formatted: 'સ્વરૂપિત', weekday: 'અઠવાડિયાનો દિવસ', weekdays: 'અઠવાડિયાના દિવસો', starts: 'શરૂ થાય છે',
  sunday: 'રવિવાર', monday: 'સોમવાર', saturday: 'શનિવાર', first: 'પ્રથમ', last: 'છેલ્લો', older: 'જૂનો', latest: 'તાજેતરનું',
  newer: 'નવું', newest: 'સૌથી નવું', oldest: 'સૌથી જૂનું', matching: 'મેળ ખાતું', search: 'શોધ', searching: 'શોધી રહ્યું છે',
  filtered: 'ગાળેલું', filter: 'ગાળો', filters: 'ગાળણીઓ', clear: 'સાફ કરો', cleared: 'સાફ કર્યું', refresh: 'ફરી લાવો',
  refreshing: 'ફરી લાવી રહ્યું છે', reload: 'ફરી ખોલો', loading: 'લવાઈ રહ્યું છે', loaded: 'લવાયું', load: 'લાવો',
  export: 'નિકાસ', exports: 'નિકાસ', import: 'આયાત', imported: 'આયાત થયું', restore: 'પુનઃસ્થાપિત કરો', backup: 'બૅકઅપ',
  download: 'ડાઉનલોડ કરો', upload: 'અપલોડ કરો', print: 'છાપો', generated: 'બનાવ્યું', copy: 'નકલ કરો', copied: 'નકલ થયું',
  respond: 'જવાબ આપો', response: 'જવાબ', responses: 'જવાબો', reply: 'જવાબ', replies: 'જવાબો', conversation: 'સંવાદ',
  conversations: 'સંવાદો', unread: 'વાંચ્યા વગરનું', read: 'વાંચેલું', status: 'સ્થિતિ', statuses: 'સ્થિતિઓ', resolved: 'ઉકેલાયું',
  review: 'સમીક્ષા', reviewing: 'સમીક્ષા થઈ રહી છે', priority: 'પ્રાથમિકતા', urgent: 'તાત્કાલિક', high: 'ઊંચી', low: 'નીચી',
  assigned: 'સોંપાયેલું', unassigned: 'સોંપ્યું નથી', assignment: 'સોંપણી', assignee: 'જવાબદાર વ્યક્તિ', triage: 'પ્રાથમિક છટણી',
  feedback: 'પ્રતિસાદ', submission: 'રજૂઆત', submissions: 'રજૂઆતો', submitted: 'મોકલાયું', received: 'મળ્યું', sent: 'મોકલ્યું',
  sender: 'મોકલનાર', message: 'સંદેશ', messages: 'સંદેશાઓ', conversation: 'સંવાદ', response: 'જવાબ', responseS: 'જવાબો',
  actions: 'કાર્યો', action: 'કાર્ય', button: 'બટન', page: 'પાનું', pages: 'પાનાં', row: 'પંક્તિ', rows: 'પંક્તિઓ',
  showing: 'દર્શાવાય છે', shown: 'દર્શાવ્યું', shownS: 'દર્શાવેલી', all: 'બધા', available: 'ઉપલબ્ધ', unavailable: 'ઉપલબ્ધ નથી',
  loaded: 'લવાયું', waiting: 'રાહ જોવાઈ રહી છે', matching: 'મેળ ખાતું', find: 'શોધો', browse: 'જુઓ', view: 'જુઓ',
  details: 'વિગતો', close: 'બંધ કરો', hide: 'છુપાવો', show: 'બતાવો', save: 'સાચવો', saved: 'સાચવ્યું', saveS: 'સાચવેલું',
  saving: 'સાચવાઈ રહ્યું છે', create: 'બનાવો', creating: 'બનાવાઈ રહ્યું છે', created: 'બનાવ્યું', add: 'ઉમેરો', adding: 'ઉમેરાઈ રહ્યું છે',
  added: 'ઉમેરાયું', edit: 'ફેરફાર કરો', update: 'સુધારો', updating: 'સુધારાઈ રહ્યું છે', updated: 'સુધારાયું', delete: 'કાઢી નાખો',
  deleted: 'કાઢી નાખ્યું', remove: 'દૂર કરો', removed: 'દૂર કર્યું', cancel: 'રદ કરો', done: 'પૂર્ણ', continue: 'ચાલુ રાખો',
  start: 'શરૂ કરો', started: 'શરૂ થયું', startfresh: 'નવી શરૂઆત કરો', fresh: 'નવી', existing: 'હાલનું', default: 'મૂળભૂત',
  optional: 'વૈકલ્પિક', required: 'ફરજિયાત', valid: 'માન્ય', invalid: 'અમાન્ય', example: 'ઉદાહરણ',
  email: 'ઇમેઇલ', emailaddress: 'ઇમેઇલ સરનામું', password: 'પાસવર્ડ', id: 'આઈડી', date: 'તારીખ', time: 'સમય', name: 'નામ',
  title: 'શીર્ષક', description: 'વિગત', note: 'નોંધ', notes: 'નોંધો', category: 'શ્રેણી', type: 'પ્રકાર', amount: 'રકમ',
  account: 'ખાતું', accounts: 'ખાતાં', member: 'સભ્ય', members: 'સભ્યો', family: 'પરિવાર', families: 'પરિવારો', owner: 'માલિક',
  income: 'આવક', expense: 'ખર્ચ', expenses: 'ખર્ચ', transaction: 'વ્યવહાર', transactions: 'વ્યવહારો', transfer: 'હસ્તાંતરણ',
  recurring: 'આવર્તિત', schedule: 'સમયપત્રક', schedules: 'સમયપત્રકો', budget: 'બજેટ', budgets: 'બજેટ', savings: 'બચત',
  goal: 'લક્ષ્ય', goals: 'લક્ષ્યો', balance: 'બાકી રકમ', spending: 'ખર્ચ', spent: 'ખર્ચાયું', cash: 'રોકડ', bank: 'બેંક',
  accountname: 'ખાતાનું નામ', money: 'નાણાં', rupee: 'રૂપિયો', dollar: 'ડૉલર', euro: 'યુરો', pound: 'પાઉન્ડ',
  incomeentries: 'આવકની નોંધો', expenseentries: 'ખર્ચની નોંધો', description: 'વિગત', detail: 'વિગત',
  day: 'દિવસ', days: 'દિવસો', month: 'મહિનો', months: 'મહિના', year: 'વર્ષ', years: 'વર્ષો', week: 'અઠવાડિયું',
  sunday: 'રવિવાર', monday: 'સોમવાર', saturday: 'શનિવાર', today: 'આજે', yesterday: 'ગઈકાલે', tomorrow: 'આવતીકાલે',
  period: 'સમયગાળો', range: 'અવધિ', regional: 'પ્રાદેશિક', earlier: 'પહેલાંની', later: 'પછીની', before: 'પહેલાં', after: 'પછી',
  this: 'આ', that: 'તે', the: '', and: 'અને', or: 'અથવા', of: 'ના', to: 'માટે', in: 'માં', on: 'પર', for: 'માટે',
  from: 'માંથી', with: 'સાથે', by: 'દ્વારા', at: 'પર', as: 'રૂપે', your: 'તમારું', you: 'તમે', we: 'અમે', our: 'અમારું',
  their: 'તેમનું', its: 'તેનું', all: 'બધા', any: 'કોઈપણ', no: 'નથી', not: 'નહીં', only: 'ફક્ત', each: 'દરેક', more: 'વધુ',
  less: 'ઓછું', other: 'અન્ય', here: 'અહીં', below: 'નીચે', above: 'ઉપર', now: 'હવે', yet: 'હજુ', still: 'હજુ પણ',
  next: 'આગળનું', previous: 'પહેલાનું', recent: 'તાજેતરનું', daily: 'દૈનિક', monthly: 'માસિક', total: 'કુલ', count: 'ગણતરી',
  counts: 'ગણતરીઓ', percentage: 'ટકાવારી', percent: 'ટકા', average: 'સરેરાશ', compared: 'સરખામણીમાં', than: 'કરતાં',
  higher: 'વધુ', lower: 'ઓછું', expected: 'અપેક્ષિત', estimated: 'અંદાજિત', estimate: 'અંદાજ', remaining: 'બાકી',
  saving: 'બચત', growth: 'વૃદ્ધિ', activity: 'પ્રવૃત્તિ', history: 'ઇતિહાસ', analytics: 'વિશ્લેષણ', report: 'અહેવાલ',
  reports: 'અહેવાલો', trend: 'વલણ', trends: 'વલણો', chart: 'આલેખ', calendar: 'કૅલેન્ડર', forecast: 'આગાહી',
  settings: 'સેટિંગ્સ', setting: 'સેટિંગ', preferences: 'પસંદગીઓ', appearance: 'દેખાવ', theme: 'થીમ', dark: 'ડાર્ક',
  light: 'લાઇટ', privacy: 'ગોપનીયતા', hidden: 'છુપાવેલું', visible: 'દેખાતું', currency: 'ચલણ', format: 'સ્વરૂપ',
  layout: 'રચના', density: 'ઘનતા', comfortable: 'આરામદાયક', compact: 'સઘન', motion: 'હલનચલન', animation: 'એનિમેશન',
  animations: 'એનિમેશન', device: 'ઉપકરણ', accessibility: 'સુલભતા', language: 'ભાષા', system: 'સિસ્ટમ', application: 'એપ',
  platform: 'પ્લેટફોર્મ', website: 'વેબસાઇટ', browser: 'બ્રાઉઝર', desktop: 'ડેસ્કટૉપ', mobile: 'મોબાઇલ', data: 'માહિતી',
  information: 'માહિતી', cloud: 'ક્લાઉડ', sync: 'સમન્વયન', synchronization: 'સમન્વયન', service: 'સેવા', services: 'સેવાઓ',
  database: 'ડેટાબેઝ', server: 'સર્વર', report: 'અહેવાલ', email: 'ઇમેઇલ', password: 'પાસવર્ડ', sign: 'પ્રવેશ', login: 'પ્રવેશ',
  logout: 'બહાર નીકળો', welcome: 'સ્વાગત', thanks: 'આભાર', please: 'કૃપા કરીને', try: 'પ્રયાસ', again: 'ફરી', check: 'ચકાસો',
  error: 'ભૂલ', failed: 'નિષ્ફળ', failure: 'નિષ્ફળતા', unable: 'શક્ય નથી', could: 'શક્યા', success: 'સફળતા', successful: 'સફળ',
  successfully: 'સફળતાપૂર્વક', unexpected: 'અણધારી', unknown: 'અજ્ઞાત', notavailable: 'ઉપલબ્ધ નથી', available: 'ઉપલબ્ધ',
  is: 'છે', are: 'છે', was: 'હતું', were: 'હતા', be: 'હોવું', has: 'છે', have: 'છે', had: 'હતું', will: 'શે', can: 'શકે',
  do: 'કરો', does: 'કરે', did: 'કર્યું', it: 'તે', its: 'તેનું', my: 'મારું', me: 'મને', they: 'તેઓ', someone: 'કોઈ વ્યક્તિ',
  who: 'જે', what: 'શું', how: 'કેવી રીતે', when: 'ક્યારે', where: 'ક્યાં', why: 'શા માટે', up: 'ઉપર', down: 'નીચે',
  out: 'બહાર', into: 'માં', without: 'વિના', across: 'સમગ્ર', throughout: 'સમગ્ર', while: 'જ્યારે', until: 'સુધી',
  then: 'પછી', because: 'કારણ કે', if: 'જો', but: 'પરંતુ', cannot: 'શકતા નથી', somebody: 'કોઈ વ્યક્તિ',
  'support team': 'સહાય ટીમ', 'account id': 'ખાતાનું આઈડી', 'user id': 'વપરાશકર્તા આઈડી',
  'pdf': 'પી.ડી.એફ.', 'csv': 'સી.એસ.વી.', 'json': 'જેસન', 'sql': 'એસ.ક્યુ.એલ.', 'api': 'એપીઆઈ', 'url': 'યુઆરએલ',
  'supabase': 'સુપાબેઝ', 'vercel': 'વર્સેલ', 'expensenest': 'ખર્ચનેસ્ટ',
});

const PRESERVED_PATTERNS = [
  /^https?:\/\//i,
  /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i,
  /^[\w.-]+\/[\w./-]+\.(sql|csv|pdf|json|png|svg|jsx?|tsx?|html?)$/i,
  /^[\da-f-]{12,}$/i,
];

const EXACT_PRESERVED_WORDS = new Set();
const DIGRAPHS = [
  ['tion', 'શન'], ['sion', 'ઝન'], ['tch', 'ચ'], ['sh', 'શ'], ['ch', 'ચ'], ['th', 'થ'],
  ['ph', 'ફ'], ['wh', 'વ'], ['qu', 'ક્વ'], ['ck', 'ક'], ['ng', 'ઙ'], ['ee', 'ી'],
  ['oo', 'ૂ'], ['ea', 'ી'], ['ai', 'ે'], ['ay', 'ે'], ['oa', 'ો'], ['ow', 'ઓ'],
  ['ou', 'ઔ'], ['ight', 'ાઇટ'], ['er', 'અર'], ['ar', 'આર'], ['or', 'ઓર'],
];
const LETTERS = {
  a: 'અ', b: 'બ', c: 'ક', d: 'ડ', e: 'એ', f: 'ફ', g: 'ગ', h: 'હ', i: 'ઇ', j: 'જ',
  k: 'ક', l: 'લ', m: 'મ', n: 'ન', o: 'ઓ', p: 'પ', q: 'ક', r: 'ર', s: 'સ', t: 'ટ',
  u: 'ઉ', v: 'વ', w: 'વ', x: 'ક્સ', y: 'ય', z: 'ઝ',
};

function transliterateWord(word) {
  let output = word.toLowerCase();
  for (const [from, to] of DIGRAPHS) output = output.replaceAll(from, to);
  return [...output].map((character) => LETTERS[character] ?? character).join('');
}

function translateWord(word) {
  const normalized = word.toLowerCase().replace(/[’]/g, "'");
  if (EXACT_PRESERVED_WORDS.has(normalized)) return word;
  if (Object.hasOwn(WORDS, normalized)) return WORDS[normalized];

  for (const [suffix, replacement] of [
    ['ies', 'ીઓ'], ['ing', 'વું'], ['ed', 'યું'], ['es', 'ઓ'], ['s', 'ઓ'],
  ]) {
    if (normalized.length > suffix.length + 3 && normalized.endsWith(suffix)) {
      const stem = normalized.slice(0, -suffix.length);
      if (Object.hasOwn(WORDS, stem)) return `${WORDS[stem]}${replacement}`;
    }
  }

  return transliterateWord(normalized);
}

export function translateGujarati(value) {
  const source = String(value ?? '');
  const trimmed = source.trim();
  if (!/[a-z]/i.test(trimmed) || PRESERVED_PATTERNS.some((pattern) => pattern.test(trimmed))) return source;

  const dynamicPhrase = trimmed.match(/^no transactions in (.+?) yet\.$/i);
  if (dynamicPhrase) return `આ ${translateGujarati(dynamicPhrase[1])}માં હજી સુધી કોઈ વ્યવહાર નથી.`;
  const recurringPhrase = trimmed.match(/^no recurring items for (.+)$/i);
  if (recurringPhrase) return `${translateGujarati(recurringPhrase[1])} માટે કોઈ આવર્તિત નોંધ નથી`;
  const welcomePhrase = trimmed.match(/^welcome back,\s*(.+)$/i);
  if (welcomePhrase) return `ફરી સ્વાગત છે, ${welcomePhrase[1]}`;

  const phrase = trimmed.toLowerCase().replace(/expensenest/g, 'expense nest').replace(/[’]/g, "'").replace(/\s+/g, ' ');
  const exact = PHRASES[phrase] ?? PHRASES[phrase.replace(/\bexpense nest\b/g, 'expensenest')];
  if (exact) return `${source.slice(0, source.indexOf(trimmed))}${exact}${source.slice(source.indexOf(trimmed) + trimmed.length)}`;

  return source.replace(/https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|[\w.-]+\/[\w./-]+\.(?:sql|csv|pdf|json|png|svg|jsx?|tsx?|html?)|[A-Za-z]+(?:[’'][A-Za-z]+)*/gi, (token) => {
    if (PRESERVED_PATTERNS.some((pattern) => pattern.test(token))) return token;
    return translateWord(token);
  });
}

export const LANGUAGE_STORAGE_KEY = 'expenseNestLanguage';
export const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = new Set(['en', 'gu']);
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'aria-description', 'alt'];
const PRESERVED_TEXT_SELECTOR = 'script,style,code,pre,textarea,input,[contenteditable="true"],[data-gujarati-preserve]';
const PRESERVED_ATTRIBUTE_SELECTOR = 'script,style,code,pre,[contenteditable="true"],[data-gujarati-preserve]';
const originalTextValues = new Map();
const originalAttributeValues = new Map();
let currentLanguage = DEFAULT_LANGUAGE;

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.has(value) ? value : DEFAULT_LANGUAGE;
}

export function getPreferredLanguage() {
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function getAppLocale() {
  return currentLanguage === 'gu' ? 'gu-IN-u-nu-gujr' : 'en-IN';
}

function languageTitle(language) {
  return language === 'gu' ? 'ખર્ચનેસ્ટ · ખર્ચ વ્યવસ્થાપક' : 'ExpenseNest - Expense Tracker';
}

function translateAttributes(element) {
  if (currentLanguage !== 'gu' || !(element instanceof Element) || element.closest(PRESERVED_ATTRIBUTE_SELECTOR)) return;
  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    if (!element.hasAttribute(attribute)) continue;
    const value = element.getAttribute(attribute);
    const translated = translateGujarati(value);
    if (translated === value) continue;
    let originals = originalAttributeValues.get(element);
    if (!originals) {
      originals = new Map();
      originalAttributeValues.set(element, originals);
    }
    originals.set(attribute, value);
    element.setAttribute(attribute, translated);
  }
}

function translateTextNode(node) {
  if (currentLanguage !== 'gu' || !node?.parentElement || node.parentElement.closest(PRESERVED_TEXT_SELECTOR)) return;
  const source = node.nodeValue;
  if (!source?.trim()) return;
  const translated = translateGujarati(source);
  if (translated === source) return;
  originalTextValues.set(node, source);
  node.nodeValue = translated;
}

function translateSubtree(root) {
  if (root?.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }
  if (root instanceof Element) {
    translateAttributes(root);
    root.querySelectorAll('*').forEach(translateAttributes);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node);
    node = walker.nextNode();
  }
}

function restoreEnglishText() {
  originalTextValues.forEach((source, node) => {
    if (node.isConnected) node.nodeValue = source;
    else originalTextValues.delete(node);
  });
  originalAttributeValues.forEach((attributes, element) => {
    if (!element.isConnected) {
      originalAttributeValues.delete(element);
      return;
    }
    attributes.forEach((source, attribute) => element.setAttribute(attribute, source));
  });
}

function applyLanguage(language) {
  const nextLanguage = normalizeLanguage(language);
  currentLanguage = nextLanguage;
  if (typeof document === 'undefined') return;
  document.documentElement.lang = nextLanguage;
  document.documentElement.dataset.language = nextLanguage;
  document.title = languageTitle(nextLanguage);
  const root = document.getElementById('root') || document.body;
  if (nextLanguage === 'gu') translateSubtree(root);
  else restoreEnglishText();
}

export function setPreferredLanguage(language) {
  const nextLanguage = normalizeLanguage(language);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  } catch {
    // Apply the page language even when browser storage is unavailable.
  }
  applyLanguage(nextLanguage);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('expensenest:language-changed', { detail: { language: nextLanguage } }));
  }
  return nextLanguage;
}

export function translateForCurrentLanguage(value) {
  return currentLanguage === 'gu' ? translateGujarati(value) : String(value ?? '');
}

export function installLocalization() {
  if (typeof window === 'undefined' || window.__expenseNestLocalizationInstalled) return;
  window.__expenseNestLocalizationInstalled = true;
  currentLanguage = getPreferredLanguage();

  const nativeConfirm = window.confirm.bind(window);
  const nativeAlert = window.alert.bind(window);
  window.confirm = (message) => nativeConfirm(translateForCurrentLanguage(message));
  window.alert = (message) => nativeAlert(translateForCurrentLanguage(message));

  applyLanguage(currentLanguage);
  const root = document.getElementById('root') || document.body;
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateTextNode(record.target);
      else if (record.type === 'attributes') translateAttributes(record.target);
      else record.addedNodes.forEach(translateSubtree);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRIBUTES,
  });

  const syncLanguage = () => applyLanguage(getPreferredLanguage());
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === LANGUAGE_STORAGE_KEY || event.key === 'expenseNestSharedPreferences') syncLanguage();
  });
  window.addEventListener('expensenest:preferences-changed', syncLanguage);
}
