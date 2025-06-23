// ===== نظام الشات بوت الذكي مع Google Gemini AI =====
// Real Estate Chatbot with AI Integration

class RealEstateChatBot {
    constructor() {
        // إعدادات Gemini AI (مجاني) - النموذج الجديد المحسن
        this.apiKey = 'AIzaSyCOCBZX-u4Jn2MnMHfEqX1yxPH4_Z9s0vY'; // مفتاح API الفعلي
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        // حالة الشات بوت
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];

        // إعدادات قاعدة البيانات
        this.supabaseClient = null;
        this.databaseData = {
            properties: [],
            contracts: [],
            installments: [],
            lastUpdate: null
        };

        // تهيئة الشات بوت معطلة
        // this.init();
    }

    // تهيئة الشات بوت المحسن مع قاعدة البيانات والصلاحيات
    async init() {
        console.log('🤖 تهيئة الشات بوت الذكي مع Gemini 2.0 Flash وقاعدة البيانات...');

        // فحص صلاحيات المستخدم أولاً
        if (!this.checkUserPermissions()) {
            console.log('🔒 الشات بوت مخصص لعمر فقط - لن يتم إظهاره');
            return;
        }

        try {
            // إنشاء واجهة الشات بوت
            this.createChatbotHTML();
            this.setupEventListeners();

            // تهيئة الاتصال بقاعدة البيانات
            console.log('🗄️ تهيئة الاتصال بقاعدة البيانات...');
            await this.initializeDatabase();

            // فحص الاتصال بـ API
            console.log('🔍 فحص الاتصال بـ Gemini 2.0 Flash API...');
            const apiHealthy = await this.checkAPIHealth();

            if (apiHealthy) {
                console.log('✅ Gemini 2.0 Flash متصل ويعمل بشكل مثالي');

                // اختبار البيانات
                await this.testDataAccess();

                this.addWelcomeMessage();
                this.updateChatbotStatus(`متصل • ${this.databaseData.properties.length} سجل + AI ⚡`);
            } else {
                console.warn('⚠️ مشكلة في الاتصال بـ API، سيتم استخدام الردود الاحتياطية');

                // اختبار البيانات حتى لو فشل AI
                await this.testDataAccess();

                this.addWelcomeMessage();
                this.updateChatbotStatus(`متصل • ${this.databaseData.properties.length} سجل فقط`);
            }

            console.log('✅ تم تهيئة الشات بوت بنجاح مع جميع المميزات');

        } catch (error) {
            console.error('❌ خطأ في تهيئة الشات بوت:', error);
            this.createChatbotHTML();
            this.setupEventListeners();
            this.addWelcomeMessage();
            this.updateChatbotStatus('متصل • وضع محدود');
        }
    }

    // فحص صلاحيات المستخدم
    checkUserPermissions() {
        try {
            // فحص المستخدم الحالي من localStorage
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                if (userData.username === 'عمر') {
                    console.log('✅ المستخدم عمر - مخول لاستخدام الشات بوت');
                    return true;
                }
            }

            // فحص المستخدم من المتغير العام
            if (typeof currentUser !== 'undefined' && currentUser === 'عمر') {
                console.log('✅ المستخدم عمر - مخول لاستخدام الشات بوت');
                return true;
            }

            // فحص إذا كان المستخدم مدير
            if (typeof users !== 'undefined' && typeof currentUser !== 'undefined') {
                const user = users[currentUser];
                if (user && (user.role === 'admin' || user.username === 'عمر')) {
                    console.log('✅ المستخدم مدير أو عمر - مخول لاستخدام الشات بوت');
                    return true;
                }
            }

            // فحص كلاس user-omar
            if (document.body.classList.contains('user-omar')) {
                console.log('✅ وضع عمر مفعل - مخول لاستخدام الشات بوت');
                return true;
            }

            console.log('🔒 المستخدم غير مخول لاستخدام الشات بوت - مخصص لعمر فقط');
            return false;

        } catch (error) {
            console.error('❌ خطأ في فحص صلاحيات المستخدم:', error);
            return false;
        }
    }

    // تهيئة الاتصال بقاعدة البيانات
    async initializeDatabase() {
        try {
            // التحقق من وجود Supabase client
            if (typeof supabase !== 'undefined') {
                this.supabaseClient = supabase;
                console.log('✅ تم الاتصال بـ Supabase بنجاح');

                // تحميل البيانات من قاعدة البيانات
                await this.loadDatabaseData();

            } else {
                console.warn('⚠️ Supabase client غير متوفر، سيتم استخدام البيانات المحلية');
            }
        } catch (error) {
            console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
        }
    }

    // تحميل البيانات من قاعدة البيانات مع التحويل
    async loadDatabaseData() {
        try {
            console.log('📥 تحميل البيانات من قاعدة البيانات...');

            // تحميل بيانات العقارات
            const { data: propertiesData, error: propertiesError } = await this.supabaseClient
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (propertiesError) {
                console.error('خطأ في تحميل العقارات:', propertiesError);
            } else {
                // تحويل البيانات إلى الصيغة المتوقعة
                this.databaseData.properties = (propertiesData || []).map(record =>
                    this.convertSupabaseToDisplayFormat(record)
                );
                console.log(`✅ تم تحميل ${this.databaseData.properties.length} عقار من Supabase`);

                // طباعة عينة من البيانات للتحقق
                if (this.databaseData.properties.length > 0) {
                    const sample = this.databaseData.properties[0];
                    console.log('📋 عينة من البيانات المحملة:', {
                        'رقم الوحدة': sample['رقم الوحدة'],
                        'اسم العقار': sample['اسم العقار'],
                        'المدينة': sample['المدينة'],
                        'اسم المستأجر': sample['اسم المستأجر'],
                        'رقم العقد': sample['رقم العقد'],
                        'الإجمالي': sample['الإجمالي']
                    });
                }
            }

            // تحميل بيانات العقود (إذا كانت متوفرة)
            try {
                const { data: contractsData, error: contractsError } = await this.supabaseClient
                    .from('contracts')
                    .select('*');

                if (!contractsError && contractsData) {
                    this.databaseData.contracts = contractsData;
                    console.log(`✅ تم تحميل ${this.databaseData.contracts.length} عقد`);
                }
            } catch (e) {
                console.log('ℹ️ جدول العقود غير متوفر');
            }

            // تحميل بيانات الأقساط (إذا كانت متوفرة)
            try {
                const { data: installmentsData, error: installmentsError } = await this.supabaseClient
                    .from('installments')
                    .select('*');

                if (!installmentsError && installmentsData) {
                    this.databaseData.installments = installmentsData;
                    console.log(`✅ تم تحميل ${this.databaseData.installments.length} قسط`);
                }
            } catch (e) {
                console.log('ℹ️ جدول الأقساط غير متوفر');
            }

            this.databaseData.lastUpdate = new Date();
            console.log('✅ تم تحميل وتحويل جميع البيانات من قاعدة البيانات بنجاح');

        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
        }
    }

    // تحديث حالة الشات بوت
    updateChatbotStatus(status) {
        const statusElement = document.querySelector('.chatbot-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // إنشاء واجهة الشات بوت مع فحص الصلاحيات
    createChatbotHTML() {
        // فحص الصلاحيات قبل إنشاء العناصر
        const hasPermission = this.checkUserPermissions();

        const chatbotHTML = `
            <!-- زر الشات بوت العائم -->
            <div class="chatbot-toggle" id="chatbotToggle" onclick="chatBot.toggleChatbot()"
                 style="display: ${hasPermission ? 'flex' : 'none'};">
                <i class="fas fa-robot"></i>
                <div class="chatbot-notification" id="chatbotNotification">1</div>
            </div>

            <!-- نافذة الشات بوت -->
            <div class="chatbot-container" id="chatbotContainer">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fas fa-robot"></i>
                        <div>
                            <div class="chatbot-name">مساعد العقارات الذكي - عمر</div>
                            <div class="chatbot-status">متصل • مدعوم بـ AI</div>
                        </div>
                    </div>
                    <div class="chatbot-controls">
                        <button class="chatbot-minimize" onclick="chatBot.minimizeChatbot()" title="تصغير">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="chatbot-close" onclick="chatBot.closeChatbot()" title="إغلاق">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="chatbot-messages" id="chatMessages">
                    <!-- الرسائل ستظهر هنا -->
                </div>

                <div class="chatbot-input-container">
                    <div class="chatbot-typing" id="chatbotTyping" style="display: none;">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>المساعد يكتب...</span>
                    </div>

                    <div class="chatbot-input">
                        <input type="text" id="chatInput" placeholder="اكتب سؤالك هنا..."
                               onkeypress="if(event.key==='Enter') chatBot.sendMessage()"
                               autocomplete="off">
                        <button onclick="chatBot.sendMessage()" id="sendButton">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // إضافة HTML للصفحة
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);

        // تسجيل حالة الصلاحيات
        if (hasPermission) {
            console.log('✅ تم إنشاء الشات بوت - المستخدم عمر مخول');
        } else {
            console.log('🔒 تم إنشاء الشات بوت مخفي - المستخدم غير مخول (مخصص لعمر فقط)');
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // منع إغلاق الشات عند النقر داخله
        const chatContainer = document.getElementById('chatbotContainer');
        if (chatContainer) {
            chatContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // إغلاق الشات عند النقر خارجه
        document.addEventListener('click', (e) => {
            if (this.isOpen && !e.target.closest('.chatbot-container') && !e.target.closest('.chatbot-toggle')) {
                this.closeChatbot();
            }
        });

        // تركيز على حقل الإدخال عند فتح الشات
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('focus', () => {
                setTimeout(() => {
                    chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            });
        }

        // مراقبة تغيير المستخدم
        this.setupUserChangeListener();
    }

    // إعداد مراقب تغيير المستخدم
    setupUserChangeListener() {
        // مراقبة تغيير localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                this.handleUserChange();
            }
        });

        // مراقبة تغيير كلاس user-omar
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.handleUserChange();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        // فحص دوري كل 5 ثوان
        setInterval(() => {
            this.handleUserChange();
        }, 5000);
    }

    // معالجة تغيير المستخدم
    handleUserChange() {
        const hasPermission = this.checkUserPermissions();
        const chatToggle = document.getElementById('chatbotToggle');
        const chatContainer = document.getElementById('chatbotContainer');

        if (hasPermission) {
            // إظهار الشات بوت
            if (chatToggle) {
                chatToggle.style.display = 'flex';
                console.log('✅ تم إظهار الشات بوت - المستخدم مخول');
            }
        } else {
            // إخفاء الشات بوت
            if (chatToggle) {
                chatToggle.style.display = 'none';
                console.log('🔒 تم إخفاء الشات بوت - المستخدم غير مخول');
            }
            if (chatContainer && this.isOpen) {
                this.closeChatbot();
            }
        }
    }

    // إضافة رسالة الترحيب المحسنة
    addWelcomeMessage() {
        const stats = this.getGeneralStatistics();
        const welcomeMessage = `
            مرحباً عمر! أنا مساعدك الذكي المتطور لإدارة العقارات 🤖⚡

            🚀 مدعوم بـ Gemini 2.0 Flash + قاعدة البيانات المباشرة!
            🔒 مخصص لك فقط مع صلاحيات كاملة

            📊 نظرة سريعة على نظامك:
            • ${stats.totalProperties} عقار في ${stats.citiesCount} مدينة
            • ${stats.totalUnits} وحدة (${stats.occupancyRate}% مؤجرة)
            • ${this.databaseData.properties.length > 0 ? '🟢 متصل بقاعدة البيانات' : '🟡 البيانات المحلية'}

            🎯 قدراتي المتقدمة الجديدة:
            • 🔢 البحث بأرقام العقود والوحدات مباشرة
            • 🏙️ استعلامات المدن والعقارات بذكاء فائق
            • 👥 البحث الذكي في المستأجرين مع تصحيح الأخطاء
            • 🏠 البحث في تفاصيل الوحدات والعقارات
            • 📈 إحصائيات وتحليلات مفصلة من قاعدة البيانات
            • 💰 البيانات المالية والأقساط الشاملة
            • 🔍 بحث شامل يفهم الأخطاء الإملائية
            • 🧠 فهم متطور للعربية العامية والفصحى
            • ⚡ ردود فورية مع النموذج الجديد

            جرب أن تسأل أي شيء مثل:
        `;

        this.addBotMessage(welcomeMessage);
        this.addQuickQuestions([
            'ابحث عن رقم العقد 20245810915',
            'تفاصيل شركة ابناء عمر بالحمر للتجارة',
            'إحصائيات شاملة للرياض',
            'ابحث عن أبو خالد في جميع المدن',
            'وحدة A101 في أي عقار؟',
            'الوحدات الفارغة في جدة مع التفاصيل',
            'تحليل مالي شامل مع الإجماليات'
        ]);
    }

    // تبديل حالة الشات بوت
    toggleChatbot() {
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    // فتح الشات بوت
    openChatbot() {
        const container = document.getElementById('chatbotContainer');
        const toggle = document.getElementById('chatbotToggle');
        const notification = document.getElementById('chatbotNotification');
        
        if (container && toggle) {
            container.style.display = 'flex';
            toggle.classList.add('active');
            this.isOpen = true;
            
            // إخفاء الإشعار
            if (notification) {
                notification.style.display = 'none';
            }
            
            // تركيز على حقل الإدخال
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    chatInput.focus();
                }
            }, 300);
            
            // تمرير للأسفل
            this.scrollToBottom();
        }
    }

    // إغلاق الشات بوت
    closeChatbot() {
        const container = document.getElementById('chatbotContainer');
        const toggle = document.getElementById('chatbotToggle');
        
        if (container && toggle) {
            container.style.display = 'none';
            toggle.classList.remove('active');
            this.isOpen = false;
        }
    }

    // تصغير الشات بوت
    minimizeChatbot() {
        this.closeChatbot();
    }

    // إرسال رسالة مع إعادة تحميل البيانات عند الحاجة
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // إضافة رسالة المستخدم
        this.addUserMessage(message);
        input.value = '';

        // إظهار مؤشر الكتابة
        this.showTyping();

        try {
            // التحقق من حداثة البيانات وإعادة تحميلها إذا لزم الأمر
            await this.ensureFreshData();

            // معالجة الرسالة بالذكاء الاصطناعي
            const response = await this.processWithAI(message);

            // إخفاء مؤشر الكتابة
            this.hideTyping();

            // إضافة رد البوت
            this.addBotMessage(response);

        } catch (error) {
            console.error('خطأ في معالجة الرسالة:', error);
            this.hideTyping();
            this.addBotMessage('عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.');
        }
    }

    // التأكد من حداثة البيانات
    async ensureFreshData() {
        const now = new Date();
        const lastUpdate = this.databaseData.lastUpdate;

        // إعادة تحميل البيانات كل 5 دقائق أو إذا لم يتم تحميلها من قبل
        if (!lastUpdate || (now - lastUpdate) > 5 * 60 * 1000) {
            console.log('🔄 إعادة تحميل البيانات من قاعدة البيانات...');
            await this.refreshDatabaseData();
        }
    }

    // معالجة الرسالة بالذكاء الاصطناعي المحسن مع قاعدة البيانات
    async processWithAI(userMessage) {
        try {
            // بناء السياق مع البيانات الحالية
            const context = this.buildContext();

            // استخراج البيانات ذات الصلة مع البحث في قاعدة البيانات
            const relevantData = await this.extractRelevantData(userMessage);

            // إذا كان هناك بحث عن رقم محدد، قم بالبحث الشامل
            const numberPattern = /\d{8,}/g;
            const numbers = userMessage.match(numberPattern);
            if (numbers && numbers.length > 0) {
                for (const number of numbers) {
                    const comprehensiveResults = await this.comprehensiveSearch(number);
                    if (comprehensiveResults.properties.length > 0 ||
                        comprehensiveResults.contracts.length > 0 ||
                        comprehensiveResults.installments.length > 0) {
                        relevantData.comprehensiveSearch = comprehensiveResults;
                        break;
                    }
                }
            }

            // تحسين الـ prompt للنموذج الجديد
            const prompt = this.buildAdvancedPrompt(context, relevantData, userMessage);

            // إرسال الطلب لـ Gemini 2.0 Flash
            const response = await this.callGeminiAPI(prompt);

            // معالجة وتحسين الرد
            const processedResponse = this.processAIResponse(response, relevantData);

            // حفظ في تاريخ المحادثة
            this.conversationHistory.push(
                { type: 'user', content: userMessage, timestamp: Date.now() },
                { type: 'bot', content: processedResponse, timestamp: Date.now() }
            );

            // الاحتفاظ بآخر 12 رسائل فقط (6 تبادلات)
            if (this.conversationHistory.length > 12) {
                this.conversationHistory = this.conversationHistory.slice(-12);
            }

            return processedResponse;

        } catch (error) {
            console.error('خطأ في AI:', error);
            return await this.getFallbackResponse(userMessage);
        }
    }

    // بناء prompt متقدم للنموذج الجديد
    buildAdvancedPrompt(context, relevantData, userMessage) {
        const conversationContext = this.conversationHistory.slice(-6).map(msg =>
            `${msg.type === 'user' ? '👤 المستخدم' : '🤖 المساعد'}: ${msg.content}`
        ).join('\n');

        return `
${context}

📊 البيانات ذات الصلة بالاستعلام:
${this.formatRelevantDataForAI(relevantData)}

💬 سياق المحادثة الأخيرة:
${conversationContext}

❓ استعلام المستخدم الحالي: "${userMessage}"

🎯 تعليمات الرد المتقدمة:
1. احلل الاستعلام بعمق وفهم المقصد الحقيقي
2. استخدم البيانات المتوفرة فقط ولا تخترع أرقام
3. قدم إجابة شاملة ومفيدة بالعربية
4. نظم الرد بشكل واضح مع رموز تعبيرية مناسبة
5. إذا كان الاستعلام عن إحصائيات، اعرضها بتنسيق جميل
6. إذا كان بحث عن أشخاص، اذكر التفاصيل المهمة
7. إذا كان مقارنة، قدم تحليل مفيد
8. اقترح استعلامات ذات صلة في نهاية الرد
9. كن ودود ومساعد ومهني

📝 الرد المطلوب:
        `;
    }

    // تنسيق البيانات للذكاء الاصطناعي مع البحث الشامل
    formatRelevantDataForAI(data) {
        let formatted = '';

        // نتائج البحث الشامل
        if (data.comprehensiveSearch) {
            const search = data.comprehensiveSearch;
            formatted += `🔍 نتائج البحث الشامل عن "${search.searchTerm}":\n`;

            if (search.properties.length > 0) {
                formatted += `📋 العقارات المطابقة (${search.properties.length}):\n`;
                search.properties.slice(0, 3).forEach((property, index) => {
                    formatted += `${index + 1}. `;
                    formatted += `العقار: ${property['اسم العقار'] || property['اسم_العقار'] || 'غير محدد'} | `;
                    formatted += `المدينة: ${property['المدينة'] || property['المدينه'] || 'غير محدد'} | `;
                    formatted += `الوحدة: ${property['رقم الوحدة'] || property['رقم_الوحدة'] || 'غير محدد'} | `;
                    formatted += `المستأجر: ${property['اسم المستأجر'] || property['اسم_المستأجر'] || 'فارغ'} | `;
                    formatted += `الحالة: ${property['حالة الوحدة'] || property['حالة_الوحدة'] || 'غير محدد'}\n`;
                });
                if (search.properties.length > 3) {
                    formatted += `... و ${search.properties.length - 3} نتيجة أخرى\n`;
                }
                formatted += '\n';
            }

            if (search.contracts.length > 0) {
                formatted += `📄 العقود المطابقة (${search.contracts.length}):\n`;
                search.contracts.slice(0, 2).forEach((contract, index) => {
                    formatted += `${index + 1}. رقم العقد: ${contract.contract_number || 'غير محدد'}\n`;
                });
                formatted += '\n';
            }

            if (search.installments.length > 0) {
                formatted += `💰 الأقساط المطابقة (${search.installments.length}):\n`;
                search.installments.slice(0, 2).forEach((installment, index) => {
                    formatted += `${index + 1}. قسط رقم: ${installment.installment_number || 'غير محدد'}\n`;
                });
                formatted += '\n';
            }
        }

        // تفاصيل العقد
        if (data.contractDetails && data.contractDetails.found) {
            formatted += `📋 تفاصيل العقد:\n`;
            if (data.contractDetails.results && data.contractDetails.results.length > 0) {
                const result = data.contractDetails.results[0];

                // استخدام القيم الفعلية مع التحقق من وجودها
                const contractNumber = result['رقم العقد'] || 'غير محدد';
                const propertyName = result['اسم العقار'] || 'غير محدد';
                const city = result['المدينة'] || 'غير محدد';
                const unitNumber = result['رقم الوحدة'] || 'غير محدد';
                const tenantName = result['اسم المستأجر'] || 'غير محدد';
                const unitStatus = result['حالة الوحدة'] || (result['اسم المستأجر'] ? 'مؤجر' : 'فارغ');
                const startDate = result['تاريخ بداية العقد'] || 'غير محدد';
                const endDate = result['تاريخ نهاية العقد'] || 'غير محدد';

                // استخدام الإجمالي بدلاً من القيمة الشهرية
                const totalAmount = result['الإجمالي'] || result['قيمة الإيجار'] || 'غير محدد';
                const monthlyRent = result['قيمة الإيجار'] || 'غير محدد';

                formatted += `- رقم العقد: ${contractNumber}\n`;
                formatted += `- العقار: ${propertyName}\n`;
                formatted += `- المدينة: ${city}\n`;
                formatted += `- رقم الوحدة: ${unitNumber}\n`;
                formatted += `- المستأجر: ${tenantName}\n`;
                formatted += `- الحالة: ${unitStatus}\n`;
                formatted += `- تاريخ البداية: ${startDate}\n`;
                formatted += `- تاريخ النهاية: ${endDate}\n`;
                formatted += `- إجمالي قيمة العقد: ${totalAmount} ريال\n`;
                if (monthlyRent !== 'غير محدد' && monthlyRent !== totalAmount) {
                    formatted += `- القيمة الشهرية: ${monthlyRent} ريال\n`;
                }

                // إضافة معلومات إضافية إذا كانت متوفرة
                if (result['المالك']) {
                    formatted += `- المالك: ${result['المالك']}\n`;
                }
                if (result['رقم جوال المستأجر']) {
                    formatted += `- جوال المستأجر: ${result['رقم جوال المستأجر']}\n`;
                }
                if (result['المساحة']) {
                    formatted += `- المساحة: ${result['المساحة']} متر مربع\n`;
                }
                if (result['نوع العقد']) {
                    formatted += `- نوع العقد: ${result['نوع العقد']}\n`;
                }

                formatted += '\n';
            }
        }

        // تفاصيل الوحدة
        if (data.unitDetails && data.unitDetails.found) {
            formatted += `🏠 تفاصيل الوحدة:\n`;
            formatted += `- عدد الوحدات المطابقة: ${data.unitDetails.count}\n`;
            data.unitDetails.units.slice(0, 2).forEach((unit, index) => {
                formatted += `${index + 1}. رقم الوحدة: ${unit['رقم الوحدة'] || unit['رقم_الوحدة']} في ${unit['اسم العقار'] || unit['اسم_العقار']}\n`;
            });
            formatted += '\n';
        }

        if (data.cityStats) {
            formatted += `🏙️ إحصائيات ${data.cityStats.cityName}:\n`;
            formatted += `- إجمالي الوحدات: ${data.cityStats.totalUnits}\n`;
            formatted += `- مؤجرة: ${data.cityStats.occupiedUnits} (${data.cityStats.occupancyRate}%)\n`;
            formatted += `- فارغة: ${data.cityStats.vacantUnits} (${data.cityStats.vacancyRate}%)\n`;
            formatted += `- عدد العقارات: ${data.cityStats.propertiesCount}\n\n`;
        }

        if (data.propertyStats) {
            formatted += `🏢 إحصائيات ${data.propertyStats.propertyName}:\n`;
            formatted += `- إجمالي الوحدات: ${data.propertyStats.totalUnits}\n`;
            formatted += `- مؤجرة: ${data.propertyStats.occupiedUnits} (${data.propertyStats.occupancyRate}%)\n`;
            formatted += `- فارغة: ${data.propertyStats.vacantUnits}\n`;
            formatted += `- المدينة: ${data.propertyStats.city}\n\n`;
        }

        if (data.tenantStats && data.tenantStats.totalUnits > 0) {
            formatted += `👤 تفاصيل المستأجرين:\n`;
            formatted += `- عدد الوحدات: ${data.tenantStats.totalUnits}\n`;
            formatted += `- المدن: ${data.tenantStats.cities.join(', ')}\n`;
            formatted += `- العقارات: ${data.tenantStats.propertiesCount}\n`;

            if (data.tenantNames && data.tenantNames.length > 0) {
                formatted += `- أسماء المستأجرين:\n`;
                data.tenantNames.forEach((name, index) => {
                    formatted += `  ${index + 1}. ${name}\n`;
                });
            }

            // إضافة تفاصيل الوحدات إذا كانت متوفرة
            if (data.tenantUnits && data.tenantUnits.length > 0) {
                formatted += `\n📋 تفاصيل الوحدات:\n`;
                data.tenantUnits.slice(0, 3).forEach((unit, index) => {
                    formatted += `${index + 1}. العقار: ${unit['اسم العقار'] || 'غير محدد'} | `;
                    formatted += `المدينة: ${unit['المدينة'] || 'غير محدد'} | `;
                    formatted += `الوحدة: ${unit['رقم الوحدة'] || 'غير محدد'} | `;
                    formatted += `العقد: ${unit['رقم العقد'] || 'غير محدد'}\n`;
                });

                if (data.tenantUnits.length > 3) {
                    formatted += `... و ${data.tenantUnits.length - 3} وحدة أخرى\n`;
                }
            }

            formatted += '\n';
        }

        if (data.statistics) {
            formatted += `📊 الإحصائيات العامة:\n`;
            formatted += `- إجمالي العقارات: ${data.statistics.totalProperties}\n`;
            formatted += `- إجمالي الوحدات: ${data.statistics.totalUnits}\n`;
            formatted += `- نسبة الإشغال: ${data.statistics.occupancyRate}%\n`;
            formatted += `- عدد المدن: ${data.statistics.citiesCount}\n\n`;
        }

        if (data.filteredUnits) {
            formatted += `🔍 الوحدات المفلترة:\n`;
            formatted += `- العدد: ${data.filteredUnits.count}\n`;
            formatted += `- توزيع المدن: ${Object.keys(data.filteredUnits.byCity).map(city =>
                `${city} (${data.filteredUnits.byCity[city].length})`).join(', ')}\n\n`;
        }

        return formatted || 'لا توجد بيانات محددة ذات صلة';
    }

    // معالجة رد الذكاء الاصطناعي
    processAIResponse(response, relevantData) {
        // تنظيف الرد من أي محتوى غير مرغوب
        let processedResponse = response.trim();

        // إضافة معلومات إضافية إذا لزم الأمر
        if (relevantData.tenantStats && relevantData.tenantStats.totalUnits > 0) {
            // إضافة تفاصيل إضافية للمستأجرين إذا لم تكن موجودة
            if (!processedResponse.includes('أسماء المستأجرين') && relevantData.tenantNames) {
                processedResponse += `\n\n👥 أسماء المستأجرين المطابقين:\n${relevantData.tenantNames.map(name => `• ${name}`).join('\n')}`;
            }
        }

        return processedResponse;
    }

    // استدعاء Gemini 2.0 Flash API المحسن
    async callGeminiAPI(prompt) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'RealEstate-ChatBot/1.0'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.8,
                            topK: 64,
                            topP: 0.95,
                            maxOutputTokens: 2048,
                            candidateCount: 1,
                            stopSequences: []
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_MEDIUM_AND_ABOVE"
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();

                // التحقق من وجود المحتوى
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    const responseText = data.candidates[0].content.parts[0].text;

                    // التحقق من جودة الرد
                    if (responseText && responseText.trim().length > 0) {
                        console.log(`✅ نجح استدعاء Gemini 2.0 Flash في المحاولة ${attempt}`);
                        return responseText;
                    }
                }

                // إذا كان الرد فارغ أو غير صالح
                throw new Error('Empty or invalid response from Gemini API');

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ فشلت المحاولة ${attempt}/${maxRetries} لاستدعاء Gemini API:`, error.message);

                // انتظار قبل إعادة المحاولة
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        // إذا فشلت جميع المحاولات
        console.error('❌ فشل في جميع محاولات استدعاء Gemini API:', lastError);
        throw lastError;
    }

    // فحص حالة الاتصال بـ API
    async checkAPIHealth() {
        try {
            const testPrompt = "مرحبا، هل تعمل بشكل صحيح؟";
            const response = await this.callGeminiAPI(testPrompt);
            console.log('✅ Gemini 2.0 Flash API يعمل بشكل صحيح');
            return true;
        } catch (error) {
            console.error('❌ مشكلة في الاتصال بـ Gemini API:', error);
            return false;
        }
    }

    // اختبار البيانات والبحث
    async testDataAccess() {
        console.log('🧪 اختبار الوصول للبيانات...');

        // اختبار البيانات المحلية
        const localDataCount = this.databaseData.properties.length;
        console.log(`📊 البيانات المحلية: ${localDataCount} سجل`);

        if (localDataCount > 0) {
            const sampleRecord = this.databaseData.properties[0];
            console.log('📋 عينة من البيانات:', {
                'رقم الوحدة': sampleRecord['رقم الوحدة'],
                'اسم العقار': sampleRecord['اسم العقار'],
                'المدينة': sampleRecord['المدينة'],
                'اسم المستأجر': sampleRecord['اسم المستأجر'],
                'الإجمالي': sampleRecord['الإجمالي']
            });
        }

        // اختبار البحث
        if (localDataCount > 0) {
            const testSearchTerm = '20245810915';
            const searchResult = this.searchInLocalData(testSearchTerm);
            console.log(`🔍 اختبار البحث عن "${testSearchTerm}":`, searchResult.found ? 'نجح' : 'فشل');
        }

        // اختبار الاتصال بـ Supabase
        if (this.supabaseClient) {
            try {
                const { data, error } = await this.supabaseClient
                    .from('properties')
                    .select('id')
                    .limit(1);

                if (!error) {
                    console.log('✅ الاتصال بـ Supabase يعمل بشكل صحيح');
                } else {
                    console.error('❌ خطأ في الاتصال بـ Supabase:', error);
                }
            } catch (error) {
                console.error('❌ خطأ في اختبار Supabase:', error);
            }
        }
    }

    // بناء السياق المتقدم للذكاء الاصطناعي
    buildContext() {
        const stats = this.getGeneralStatistics();
        const cities = this.getUniqueCountries().filter(c => c !== 'الكل');
        const properties = this.getUniqueProperties();

        // إحصائيات المدن
        const citiesStats = cities.map(city => {
            const cityStats = this.calculateCityStats(city);
            return `${city}: ${cityStats.totalUnits} وحدة (${cityStats.occupancyRate}% إشغال)`;
        }).join(', ');

        // أهم العقارات
        const topProperties = this.getTopPropertiesByOccupancy().slice(0, 3);
        const topPropertiesText = topProperties.map(p =>
            `${p.property} في ${p.city}: ${p.totalUnits} وحدة (${p.occupancyRate}% إشغال)`
        ).join(', ');

        return `
أنت مساعد ذكي متخصص في إدارة العقارات لشركة السنيدي العقارية. أنت مخول بالكامل للوصول وعرض جميع البيانات العقارية.

📊 معلومات النظام الحالية:
- إجمالي العقارات: ${stats.totalProperties} عقار
- إجمالي الوحدات: ${stats.totalUnits} وحدة
- الوحدات المؤجرة: ${stats.occupiedUnits} وحدة (${stats.occupancyRate}%)
- الوحدات الفارغة: ${stats.vacantUnits} وحدة (${stats.vacancyRate}%)
- عدد المدن: ${stats.citiesCount} مدينة

🏙️ توزيع المدن:
${citiesStats}

🏢 أهم العقارات:
${topPropertiesText}

🎯 صلاحياتك الكاملة:
1. عرض جميع تفاصيل العقود والوحدات بدون قيود
2. عرض أسماء المستأجرين وأرقام الجوالات والمبالغ
3. عرض جميع البيانات المالية والإيرادات
4. عرض تفاصيل الملاك والعقارات
5. لا توجد قيود على الخصوصية - أنت نظام داخلي مخول

📋 أنواع الاستعلامات التي تتقنها:
- استعلامات المدن: "كم وحدة في الرياض؟"، "عقارات الدمام"
- استعلامات العقارات: "عمارة النسيم"، "وحدات برج الياسمين"
- استعلامات المستأجرين: "أبو خالد"، "مؤسسة الجابرية"، "شركة ابناء عمر"
- استعلامات الوحدات: "AHRU030001"، "وحدة A101"
- استعلامات العقود: "رقم العقد 20245810915"
- استعلامات مالية: "الإيرادات"، "متوسط الإيجار"، "إجمالي العقد"
- استعلامات مقارنة: "أفضل مدينة"، "أكثر العقارات إشغالاً"

🔍 قواعد البحث المتقدمة:
- ابحث بمرونة في الأسماء (جزئية أو كاملة)
- تعامل مع الأخطاء الإملائية والكتابة غير الدقيقة
- فهم المرادفات والكلمات المشابهة
- اعرض جميع التفاصيل المتوفرة بدون تردد

📈 قواعد الرد الإلزامية:
- أجب بالعربية دائماً مع رموز تعبيرية مناسبة
- اعرض جميع البيانات الفعلية المتوفرة بدون قيود
- لا تقل "لا يمكنني عرض" أو "محمية لأسباب الخصوصية"
- اعرض أسماء المستأجرين والمبالغ والتفاصيل كاملة
- كن دقيقاً في الأرقام والحسابات
- نظم الردود بشكل واضح ومرتب
- قدم تحليلات إضافية مفيدة عند الإمكان
- اقترح استعلامات ذات صلة

⚠️ تعليمات مهمة:
- أنت نظام إدارة عقارات داخلي مخول بعرض جميع البيانات
- لا توجد قيود خصوصية على البيانات العقارية
- اعرض جميع التفاصيل المطلوبة بوضوح وشفافية
- المستخدم مخول للوصول لجميع المعلومات
        `;
    }

    // استخراج البيانات ذات الصلة - نظام متقدم مع قاعدة البيانات
    async extractRelevantData(message) {
        const data = {};
        const normalizedMessage = this.normalizeArabicText(message);

        // استخدام البيانات من قاعدة البيانات أو البيانات المحلية
        const dataSource = this.databaseData.properties.length > 0 ? this.databaseData.properties : properties;

        // 1. البحث عن رقم العقد
        const contractData = await this.findContractInMessage(normalizedMessage);
        if (contractData.found) {
            data.contractDetails = contractData;
        }

        // 2. البحث المتقدم عن المدن
        const cityData = this.findCityInMessage(normalizedMessage, dataSource);
        if (cityData) {
            data.cityProperties = dataSource.filter(p => this.normalizeArabicText(p['المدينة'] || '') === this.normalizeArabicText(cityData.name));
            data.cityStats = this.calculateCityStats(cityData.name, dataSource);
        }

        // 3. البحث المتقدم عن العقارات
        const propertyData = this.findPropertyInMessage(normalizedMessage, dataSource);
        if (propertyData) {
            data.propertyUnits = dataSource.filter(p => this.normalizeArabicText(p['اسم العقار'] || '') === this.normalizeArabicText(propertyData.name));
            data.propertyStats = this.calculatePropertyStats(propertyData.name, dataSource);
        }

        // 4. البحث المتقدم عن المستأجرين
        const tenantData = this.findTenantInMessage(normalizedMessage, dataSource);
        if (tenantData.found) {
            data.tenantUnits = tenantData.units;
            data.tenantStats = tenantData.stats;
            data.tenantNames = tenantData.tenantNames;
        }

        // 5. البحث عن الملاك
        const ownerData = this.findOwnerInMessage(normalizedMessage, dataSource);
        if (ownerData.found) {
            data.ownerUnits = ownerData.units;
            data.ownerStats = ownerData.stats;
        }

        // 6. البحث في رقم الوحدة
        const unitData = this.findUnitInMessage(normalizedMessage, dataSource);
        if (unitData.found) {
            data.unitDetails = unitData;
        }

        // 7. البحث في الأقساط
        const installmentData = await this.findInstallmentInMessage(normalizedMessage);
        if (installmentData.found) {
            data.installmentDetails = installmentData;
        }

        // 8. تحليل نوع الاستعلام
        const queryType = this.analyzeQueryType(normalizedMessage);
        data.queryType = queryType;

        // 9. إحصائيات حسب نوع الاستعلام
        if (queryType.isStatistics) {
            data.statistics = this.getAdvancedStatistics(normalizedMessage, dataSource);
        }

        // 10. فلترة البيانات حسب الحالة
        if (queryType.statusFilter) {
            data.filteredUnits = this.filterUnitsByStatus(queryType.statusFilter, cityData?.name, propertyData?.name, dataSource);
        }

        // 11. بيانات مالية
        if (queryType.isFinancial) {
            data.financialData = this.getFinancialData(cityData?.name, propertyData?.name, dataSource);
        }

        // 12. تحليل الاتجاهات والأنماط
        if (queryType.isTrend) {
            data.trendAnalysis = this.analyzeTrends(dataSource);
        }

        return data;
    }

    // تطبيع النص العربي للبحث المتقدم
    normalizeArabicText(text) {
        return text
            .replace(/أ|إ|آ/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ي/g, 'ى')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    // البحث عن رقم العقد في قاعدة البيانات
    async findContractInMessage(message) {
        // البحث عن أرقام في الرسالة
        const numberPattern = /\d{8,}/g;
        const numbers = message.match(numberPattern);

        if (!numbers) {
            return { found: false };
        }

        for (const number of numbers) {
            // البحث في البيانات المحلية أولاً
            const localResult = this.searchInLocalData(number);
            if (localResult.found) {
                return localResult;
            }

            // البحث في قاعدة البيانات إذا كانت متوفرة
            if (this.supabaseClient) {
                try {
                    const dbResult = await this.searchInDatabase(number);
                    if (dbResult.found) {
                        return dbResult;
                    }
                } catch (error) {
                    console.error('خطأ في البحث في قاعدة البيانات:', error);
                }
            }
        }

        return { found: false, searchedNumbers: numbers };
    }

    // البحث في البيانات المحلية مع تحسينات
    searchInLocalData(searchTerm) {
        // استخدام البيانات من Supabase أولاً إذا كانت متوفرة
        const dataSource = this.databaseData.properties.length > 0 ? this.databaseData.properties : properties;

        console.log(`🔍 البحث عن "${searchTerm}" في ${dataSource.length} سجل...`);

        // البحث في جميع الحقول مع تطبيع النص
        const normalizedSearchTerm = this.normalizeArabicText(searchTerm);

        const results = dataSource.filter(item => {
            return Object.entries(item).some(([key, value]) => {
                if (value && (typeof value === 'string' || typeof value === 'number')) {
                    const normalizedValue = this.normalizeArabicText(String(value));
                    const directMatch = normalizedValue.includes(normalizedSearchTerm);
                    const reverseMatch = normalizedSearchTerm.includes(normalizedValue);

                    if (directMatch || reverseMatch) {
                        console.log(`✅ تطابق في الحقل "${key}": "${value}"`);
                        return true;
                    }
                }
                return false;
            });
        });

        if (results.length > 0) {
            console.log(`✅ وجدت ${results.length} نتيجة مطابقة`);
            return {
                found: true,
                results: results,
                searchTerm: searchTerm,
                source: this.databaseData.properties.length > 0 ? 'supabase' : 'local'
            };
        }

        console.log(`❌ لم يتم العثور على نتائج للبحث عن "${searchTerm}"`);
        return { found: false };
    }

    // البحث في قاعدة البيانات مع أسماء الحقول الصحيحة
    async searchInDatabase(searchTerm) {
        if (!this.supabaseClient) {
            return { found: false };
        }

        try {
            // البحث في جدول العقارات باستخدام أسماء الحقول الصحيحة
            const { data: propertiesResults, error: propertiesError } = await this.supabaseClient
                .from('properties')
                .select('*')
                .or(`contract_number.ilike.%${searchTerm}%,unit_number.ilike.%${searchTerm}%,tenant_name.ilike.%${searchTerm}%,property_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,owner.ilike.%${searchTerm}%,tenant_phone.ilike.%${searchTerm}%,deed_number.ilike.%${searchTerm}%`);

            if (!propertiesError && propertiesResults && propertiesResults.length > 0) {
                // تحويل البيانات إلى الصيغة المتوقعة
                const convertedResults = propertiesResults.map(this.convertSupabaseToDisplayFormat);

                return {
                    found: true,
                    results: convertedResults,
                    searchTerm: searchTerm,
                    source: 'database'
                };
            }

            // البحث في جدول العقود إذا كان متوفراً
            if (this.databaseData.contracts.length > 0) {
                const contractResults = this.databaseData.contracts.filter(contract => {
                    return Object.values(contract).some(value => {
                        if (value && typeof value === 'string') {
                            return value.includes(searchTerm);
                        }
                        return false;
                    });
                });

                if (contractResults.length > 0) {
                    return {
                        found: true,
                        results: contractResults,
                        searchTerm: searchTerm,
                        source: 'contracts'
                    };
                }
            }

        } catch (error) {
            console.error('خطأ في البحث في قاعدة البيانات:', error);
        }

        return { found: false };
    }

    // تحويل بيانات Supabase إلى صيغة العرض
    convertSupabaseToDisplayFormat(supabaseRecord) {
        return {
            'رقم الوحدة': supabaseRecord.unit_number || '',
            'اسم العقار': supabaseRecord.property_name || '',
            'المدينة': supabaseRecord.city || '',
            'اسم المستأجر': supabaseRecord.tenant_name || '',
            'رقم العقد': supabaseRecord.contract_number || '',
            'قيمة الإيجار': supabaseRecord.rent_value || '',
            'الإجمالي': supabaseRecord.total_amount || supabaseRecord.rent_value || '',
            'المساحة': supabaseRecord.area || '',
            'تاريخ بداية العقد': supabaseRecord.start_date || '',
            'تاريخ نهاية العقد': supabaseRecord.end_date || '',
            'حالة الوحدة': supabaseRecord.tenant_name ? 'مؤجر' : 'فارغ',
            'المالك': supabaseRecord.owner || '',
            'رقم جوال المستأجر': supabaseRecord.tenant_phone || '',
            'رقم جوال إضافي': supabaseRecord.tenant_phone_2 || '',
            'رقم الصك': supabaseRecord.deed_number || '',
            'السجل العقاري': supabaseRecord.real_estate_registry || '',
            'مساحة الصك': supabaseRecord.deed_area || '',
            'نوع العقد': supabaseRecord.contract_type || '',
            'عدد الأقساط': supabaseRecord.installment_count || '',
            // الأقساط
            'تاريخ القسط الأول': supabaseRecord.first_installment_date || '',
            'مبلغ القسط الأول': supabaseRecord.first_installment_amount || '',
            'تاريخ القسط الثاني': supabaseRecord.second_installment_date || '',
            'مبلغ القسط الثاني': supabaseRecord.second_installment_amount || '',
            'تاريخ القسط الثالث': supabaseRecord.third_installment_date || '',
            'مبلغ القسط الثالث': supabaseRecord.third_installment_amount || '',
            'تاريخ القسط الرابع': supabaseRecord.fourth_installment_date || '',
            'مبلغ القسط الرابع': supabaseRecord.fourth_installment_amount || '',
            'تاريخ القسط الخامس': supabaseRecord.fifth_installment_date || '',
            'مبلغ القسط الخامس': supabaseRecord.fifth_installment_amount || '',
            // معلومات إضافية
            'id': supabaseRecord.id,
            'created_at': supabaseRecord.created_at,
            'updated_at': supabaseRecord.updated_at
        };
    }

    // البحث المتقدم عن المدن
    findCityInMessage(message, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);
        const cities = this.getUniqueCountries(data).filter(c => c !== 'الكل');

        const cityAliases = {
            'الرياض': ['رياض', 'الرياض', 'العاصمة'],
            'الدمام': ['دمام', 'الدمام', 'الشرقية'],
            'جدة': ['جده', 'جدة', 'عروس البحر'],
            'مكة': ['مكه', 'مكة', 'المكرمة', 'مكة المكرمة'],
            'المدينة': ['المدينه', 'المدينة', 'المنورة', 'المدينة المنورة'],
            'الطائف': ['طائف', 'الطائف'],
            'الخبر': ['خبر', 'الخبر'],
            'القطيف': ['قطيف', 'القطيف'],
            'الأحساء': ['احساء', 'الاحساء', 'الأحساء', 'هفوف'],
            'أبها': ['ابها', 'أبها', 'عسير'],
            'تبوك': ['تبوك'],
            'بريدة': ['بريده', 'بريدة', 'القصيم'],
            'خميس مشيط': ['خميس', 'مشيط', 'خميس مشيط'],
            'حائل': ['حائل'],
            'نجران': ['نجران'],
            'الباحة': ['باحه', 'الباحة'],
            'عرعر': ['عرعر'],
            'سكاكا': ['سكاكا', 'الجوف'],
            'جازان': ['جازان', 'جيزان']
        };

        for (const city of cities) {
            const normalizedCity = this.normalizeArabicText(city);
            const aliases = cityAliases[city] || [city];

            for (const alias of aliases) {
                const normalizedAlias = this.normalizeArabicText(alias);
                if (message.includes(normalizedAlias)) {
                    return { name: city, alias: alias };
                }
            }
        }
        return null;
    }

    // البحث في رقم الوحدة مع دعم الأرقام الطويلة
    findUnitInMessage(message, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);

        // البحث عن أرقام أو رموز الوحدات
        const unitPatterns = [
            /[A-Za-z]\d+/g,  // مثل A101, B205
            /\d+[A-Za-z]/g,  // مثل 101A, 205B
            /[A-Z]{2,}\d{6,}/g,  // مثل AHRU030001
            /\d{6,}/g,  // أرقام طويلة مثل 030001
            /وحدة\s*([A-Za-z0-9]+)/gi,  // وحدة A101
            /رقم\s*([A-Za-z0-9]+)/gi    // رقم A101
        ];

        const foundUnits = [];
        const searchTerms = new Set();

        // استخراج جميع المصطلحات المحتملة
        for (const pattern of unitPatterns) {
            const matches = message.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const cleanMatch = match.replace(/وحدة\s*|رقم\s*/gi, '').trim();
                    searchTerms.add(cleanMatch);
                }
            }
        }

        // البحث في البيانات
        for (const searchTerm of searchTerms) {
            const unitResults = data.filter(item => {
                const unitNumber = item['رقم الوحدة'] || item['رقم_الوحدة'] || '';
                const normalizedUnit = this.normalizeArabicText(unitNumber);
                const normalizedSearch = this.normalizeArabicText(searchTerm);

                // مطابقة مباشرة
                if (normalizedUnit === normalizedSearch) {
                    return true;
                }

                // مطابقة جزئية
                if (normalizedUnit.includes(normalizedSearch) || normalizedSearch.includes(normalizedUnit)) {
                    return true;
                }

                return false;
            });

            if (unitResults.length > 0) {
                foundUnits.push(...unitResults);
            }
        }

        // إزالة المكررات
        const uniqueUnits = foundUnits.filter((unit, index, self) =>
            index === self.findIndex(u => u.id === unit.id ||
                (u['رقم الوحدة'] === unit['رقم الوحدة'] && u['اسم العقار'] === unit['اسم العقار']))
        );

        if (uniqueUnits.length > 0) {
            return {
                found: true,
                units: uniqueUnits,
                count: uniqueUnits.length
            };
        }

        return { found: false };
    }

    // البحث في الأقساط
    async findInstallmentInMessage(message) {
        if (this.databaseData.installments.length === 0) {
            return { found: false };
        }

        const installmentKeywords = ['قسط', 'اقساط', 'دفعة', 'مبلغ', 'سداد'];
        const hasInstallmentKeyword = installmentKeywords.some(keyword => message.includes(keyword));

        if (!hasInstallmentKeyword) {
            return { found: false };
        }

        // البحث عن أرقام في الرسالة
        const numberPattern = /\d+/g;
        const numbers = message.match(numberPattern);

        if (!numbers) {
            return { found: false };
        }

        const foundInstallments = [];

        for (const number of numbers) {
            const installmentResults = this.databaseData.installments.filter(installment => {
                return Object.values(installment).some(value => {
                    if (value && typeof value === 'string') {
                        return value.includes(number);
                    }
                    return false;
                });
            });

            if (installmentResults.length > 0) {
                foundInstallments.push(...installmentResults);
            }
        }

        if (foundInstallments.length > 0) {
            return {
                found: true,
                installments: foundInstallments,
                count: foundInstallments.length
            };
        }

        return { found: false };
    }

    // البحث المتقدم عن العقارات
    findPropertyInMessage(message, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);
        const properties = this.getUniqueProperties(data);

        for (const property of properties) {
            const normalizedProperty = this.normalizeArabicText(property);
            if (message.includes(normalizedProperty)) {
                return { name: property };
            }

            // البحث بالكلمات الجزئية
            const propertyWords = normalizedProperty.split(' ');
            const messageWords = message.split(' ');

            let matchCount = 0;
            for (const word of propertyWords) {
                if (word.length > 2 && messageWords.some(mWord => mWord.includes(word) || word.includes(mWord))) {
                    matchCount++;
                }
            }

            if (matchCount >= Math.ceil(propertyWords.length / 2)) {
                return { name: property, partial: true };
            }
        }
        return null;
    }

    // البحث المتقدم عن المستأجرين مع تصحيح الأخطاء
    findTenantInMessage(message, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);
        const tenantKeywords = ['مستأجر', 'ساكن', 'قاطن', 'أبو', 'ابو', 'أم', 'ام', 'مستاجر', 'مستئجر', 'مؤسسة', 'شركة', 'مكتب'];
        const hasTenantKeyword = tenantKeywords.some(keyword => message.includes(keyword));

        // البحث حتى لو لم تكن هناك كلمات مفتاحية (للأسماء المباشرة)
        const matchingUnits = [];
        const tenantNames = new Set();

        data.forEach(unit => {
            const tenantName = unit['اسم المستأجر'] || unit['اسم_المستأجر'] || unit['المستأجر'] || '';
            if (tenantName && tenantName.trim() !== '') {
                const normalizedTenant = this.normalizeArabicText(tenantName);
                const normalizedMessage = this.normalizeArabicText(message);

                // إزالة كلمات البحث من الرسالة
                const cleanMessage = normalizedMessage.replace(/مستأجر|ساكن|قاطن|ابحث|عن|تفاصيل|معلومات/g, '').trim();

                // البحث المباشر
                if (normalizedTenant.includes(cleanMessage) || cleanMessage.includes(normalizedTenant)) {
                    matchingUnits.push(unit);
                    tenantNames.add(tenantName);
                    return;
                }

                // البحث بالكلمات الجزئية مع تصحيح الأخطاء
                const tenantWords = normalizedTenant.split(' ').filter(word => word.length > 2);
                const messageWords = cleanMessage.split(' ').filter(word => word.length > 2);

                let matchScore = 0;
                let totalWords = tenantWords.length;

                for (const tenantWord of tenantWords) {
                    for (const messageWord of messageWords) {
                        // مطابقة مباشرة
                        if (tenantWord === messageWord) {
                            matchScore += 3;
                            break;
                        }
                        // مطابقة جزئية قوية
                        else if (tenantWord.includes(messageWord) && messageWord.length > 3) {
                            matchScore += 2;
                            break;
                        }
                        else if (messageWord.includes(tenantWord) && tenantWord.length > 3) {
                            matchScore += 2;
                            break;
                        }
                        // مطابقة جزئية ضعيفة
                        else if (tenantWord.includes(messageWord) || messageWord.includes(tenantWord)) {
                            matchScore += 1;
                            break;
                        }
                        // مطابقة مع تصحيح الأخطاء البسيطة
                        else if (this.calculateSimilarity(tenantWord, messageWord) > 0.8) {
                            matchScore += 1;
                            break;
                        }
                    }
                }

                // تقليل الحد الأدنى للمطابقة للأسماء الطويلة
                const requiredScore = Math.max(2, Math.ceil(totalWords * 0.4));

                if (matchScore >= requiredScore) {
                    matchingUnits.push(unit);
                    tenantNames.add(tenantName);
                }
            }
        });

        if (matchingUnits.length > 0) {
            return {
                found: true,
                units: matchingUnits,
                tenantNames: Array.from(tenantNames),
                stats: this.calculateTenantStats(matchingUnits)
            };
        }

        return { found: false };
    }

    // حساب التشابه بين كلمتين لتصحيح الأخطاء
    calculateSimilarity(str1, str2) {
        if (str1.length === 0 || str2.length === 0) return 0;
        if (str1 === str2) return 1;

        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    // حساب المسافة بين كلمتين (Levenshtein Distance)
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // البحث عن الملاك مع تصحيح الأخطاء
    findOwnerInMessage(message, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);
        const ownerKeywords = ['مالك', 'ملاك', 'صاحب', 'مالكة', 'مالكه'];
        const hasOwnerKeyword = ownerKeywords.some(keyword => message.includes(keyword));

        if (!hasOwnerKeyword) {
            return { found: false };
        }

        const matchingUnits = [];
        const ownerNames = new Set();

        data.forEach(unit => {
            const ownerName = unit['اسم المالك'] || unit['اسم_المالك'] || unit['المالك'] || '';
            if (ownerName && ownerName.trim() !== '') {
                const normalizedOwner = this.normalizeArabicText(ownerName);
                const normalizedMessage = this.normalizeArabicText(message);

                // البحث المباشر
                if (normalizedMessage.includes(normalizedOwner) || normalizedOwner.includes(normalizedMessage.replace(/مالك|ملاك|صاحب/g, '').trim())) {
                    matchingUnits.push(unit);
                    ownerNames.add(ownerName);
                    return;
                }

                // البحث بالكلمات الجزئية
                const ownerWords = normalizedOwner.split(' ').filter(word => word.length > 1);
                const messageWords = normalizedMessage.split(' ').filter(word => word.length > 1);

                let matchScore = 0;
                for (const ownerWord of ownerWords) {
                    for (const messageWord of messageWords) {
                        if (ownerWord === messageWord || ownerWord.includes(messageWord) || messageWord.includes(ownerWord)) {
                            matchScore++;
                            break;
                        }
                        else if (this.calculateSimilarity(ownerWord, messageWord) > 0.7) {
                            matchScore++;
                            break;
                        }
                    }
                }

                if (matchScore >= Math.max(1, Math.ceil(ownerWords.length / 2))) {
                    matchingUnits.push(unit);
                    ownerNames.add(ownerName);
                }
            }
        });

        if (matchingUnits.length > 0) {
            return {
                found: true,
                units: matchingUnits,
                ownerNames: Array.from(ownerNames),
                stats: this.calculateOwnerStats(matchingUnits)
            };
        }

        return { found: false };
    }

    // فحص إذا كان النص يحتوي على اسم شخص أو مؤسسة
    containsPersonName(message) {
        const namePatterns = [
            // أسماء الأشخاص
            /أبو\s+\w+/g,
            /ابو\s+\w+/g,
            /أم\s+\w+/g,
            /ام\s+\w+/g,
            /محمد/g,
            /أحمد/g,
            /عبد\s*الله/g,
            /عبد\s*الرحمن/g,
            /عبد\s*العزيز/g,
            /خالد/g,
            /سعد/g,
            /فهد/g,
            /علي/g,
            /حسن/g,
            /حسين/g,

            // المؤسسات والشركات
            /مؤسسة\s+\w+/g,
            /شركة\s+\w+/g,
            /مكتب\s+\w+/g,
            /مجموعة\s+\w+/g,
            /مؤسسة.*للتجارة/g,
            /شركة.*للتجارة/g,
            /مؤسسة.*المتميزة/g,
            /الجابرية/g,
            /ابناء\s+عمر/g,
            /بالحمر/g,

            // أرقام الوحدات
            /[A-Z]+\d+/g,
            /\d+[A-Z]+/g,
            /AHRU\d+/g
        ];

        return namePatterns.some(pattern => pattern.test(message));
    }

    // تحليل نوع الاستعلام
    analyzeQueryType(message) {
        const queryType = {
            isStatistics: false,
            isFinancial: false,
            isTrend: false,
            isComparison: false,
            statusFilter: null,
            searchType: null
        };

        // كلمات الإحصائيات
        const statsKeywords = ['إحصائيات', 'تقرير', 'عدد', 'كم', 'إجمالي', 'مجموع', 'نسبة', 'معدل', 'توزيع'];
        queryType.isStatistics = statsKeywords.some(keyword => message.includes(keyword));

        // كلمات مالية
        const financialKeywords = ['إيراد', 'دخل', 'مبلغ', 'قسط', 'راتب', 'مالي', 'تكلفة', 'ربح'];
        queryType.isFinancial = financialKeywords.some(keyword => message.includes(keyword));

        // كلمات الاتجاهات
        const trendKeywords = ['اتجاه', 'تطور', 'نمو', 'انخفاض', 'زيادة', 'تحسن', 'تراجع'];
        queryType.isTrend = trendKeywords.some(keyword => message.includes(keyword));

        // كلمات المقارنة
        const comparisonKeywords = ['مقارنة', 'أفضل', 'أسوأ', 'أكثر', 'أقل', 'الأعلى', 'الأدنى'];
        queryType.isComparison = comparisonKeywords.some(keyword => message.includes(keyword));

        // فلتر الحالة
        if (message.includes('فارغ') || message.includes('شاغر') || message.includes('متاح')) {
            queryType.statusFilter = 'فارغ';
        } else if (message.includes('مؤجر') || message.includes('مشغول') || message.includes('مستأجر')) {
            queryType.statusFilter = 'مؤجر';
        }

        return queryType;
    }

    // حساب إحصائيات المدينة مع البيانات الصحيحة
    calculateCityStats(cityName, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);

        const cityUnits = data.filter(p => {
            const unitCity = p['المدينة'] || '';
            return this.normalizeArabicText(unitCity) === this.normalizeArabicText(cityName);
        });

        const occupiedUnits = cityUnits.filter(p => {
            const tenantName = p['اسم المستأجر'] || '';
            const unitStatus = p['حالة الوحدة'] || '';
            return tenantName.trim() !== '' || unitStatus === 'مؤجر';
        });

        const vacantUnits = cityUnits.filter(p => {
            const tenantName = p['اسم المستأجر'] || '';
            const unitStatus = p['حالة الوحدة'] || '';
            return tenantName.trim() === '' && unitStatus !== 'مؤجر';
        });

        const uniqueProperties = new Set(cityUnits.map(p => p['اسم العقار']).filter(name => name && name.trim() !== '')).size;

        return {
            cityName,
            totalUnits: cityUnits.length,
            occupiedUnits: occupiedUnits.length,
            vacantUnits: vacantUnits.length,
            occupancyRate: cityUnits.length > 0 ? Math.round(occupiedUnits.length / cityUnits.length * 100) : 0,
            vacancyRate: cityUnits.length > 0 ? Math.round(vacantUnits.length / cityUnits.length * 100) : 0,
            propertiesCount: uniqueProperties,
            averageUnitsPerProperty: uniqueProperties > 0 ? Math.round(cityUnits.length / uniqueProperties) : 0
        };
    }

    // حساب إحصائيات العقار مع البيانات الصحيحة
    calculatePropertyStats(propertyName, dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);

        const propertyUnits = data.filter(p => {
            const unitProperty = p['اسم العقار'] || '';
            return this.normalizeArabicText(unitProperty) === this.normalizeArabicText(propertyName);
        });

        const occupiedUnits = propertyUnits.filter(p => {
            const tenantName = p['اسم المستأجر'] || '';
            const unitStatus = p['حالة الوحدة'] || '';
            return tenantName.trim() !== '' || unitStatus === 'مؤجر';
        });

        const vacantUnits = propertyUnits.filter(p => {
            const tenantName = p['اسم المستأجر'] || '';
            const unitStatus = p['حالة الوحدة'] || '';
            return tenantName.trim() === '' && unitStatus !== 'مؤجر';
        });

        return {
            propertyName,
            totalUnits: propertyUnits.length,
            occupiedUnits: occupiedUnits.length,
            vacantUnits: vacantUnits.length,
            occupancyRate: propertyUnits.length > 0 ? Math.round(occupiedUnits.length / propertyUnits.length * 100) : 0,
            city: propertyUnits[0]?.['المدينة'] || 'غير محدد'
        };
    }

    // حساب إحصائيات المستأجر
    calculateTenantStats(tenantUnits) {
        const cities = new Set(tenantUnits.map(u => u['المدينة']));
        const properties = new Set(tenantUnits.map(u => u['اسم العقار']));

        return {
            totalUnits: tenantUnits.length,
            cities: Array.from(cities),
            properties: Array.from(properties),
            citiesCount: cities.size,
            propertiesCount: properties.size
        };
    }

    // حساب إحصائيات المالك
    calculateOwnerStats(ownerUnits) {
        const cities = new Set(ownerUnits.map(u => u['المدينة']));
        const properties = new Set(ownerUnits.map(u => u['اسم العقار']));
        const occupiedUnits = ownerUnits.filter(u => u['حالة الوحدة'] === 'مؤجر');

        return {
            totalUnits: ownerUnits.length,
            occupiedUnits: occupiedUnits.length,
            vacantUnits: ownerUnits.length - occupiedUnits.length,
            cities: Array.from(cities),
            properties: Array.from(properties),
            occupancyRate: ownerUnits.length > 0 ? Math.round(occupiedUnits.length / ownerUnits.length * 100) : 0
        };
    }

    // الحصول على إحصائيات متقدمة
    getAdvancedStatistics(message) {
        const stats = this.getGeneralStatistics();

        // إحصائيات المدن
        const citiesStats = {};
        const cities = this.getUniqueCountries().filter(c => c !== 'الكل');
        cities.forEach(city => {
            citiesStats[city] = this.calculateCityStats(city);
        });

        // إحصائيات العقارات
        const propertiesStats = {};
        const properties = this.getUniqueProperties();
        properties.forEach(property => {
            propertiesStats[property] = this.calculatePropertyStats(property);
        });

        return {
            ...stats,
            citiesStats,
            propertiesStats,
            topCities: this.getTopCitiesByOccupancy(),
            topProperties: this.getTopPropertiesByOccupancy()
        };
    }

    // الحصول على الإحصائيات العامة مع البيانات الصحيحة
    getGeneralStatistics(dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);

        const totalProperties = this.getUniqueProperties(data).length;
        const totalUnits = data.length;

        const occupiedUnits = data.filter(p => {
            const tenantName = p['اسم المستأجر'] || '';
            const unitStatus = p['حالة الوحدة'] || '';
            return tenantName.trim() !== '' || unitStatus === 'مؤجر';
        }).length;

        const vacantUnits = data.filter(p => {
            const tenantName = p['اسم المستأجر'] || '';
            const unitStatus = p['حالة الوحدة'] || '';
            return tenantName.trim() === '' && unitStatus !== 'مؤجر';
        }).length;

        const cities = this.getUniqueCountries(data).filter(c => c !== 'الكل');

        return {
            totalProperties,
            totalUnits,
            occupiedUnits,
            vacantUnits,
            occupancyRate: totalUnits > 0 ? Math.round(occupiedUnits / totalUnits * 100) : 0,
            vacancyRate: totalUnits > 0 ? Math.round(vacantUnits / totalUnits * 100) : 0,
            citiesCount: cities.length,
            cities: cities
        };
    }

    // فلترة الوحدات حسب الحالة
    filterUnitsByStatus(status, cityName = null, propertyName = null) {
        let filteredUnits = properties.filter(p => p['حالة الوحدة'] === status);

        if (cityName) {
            filteredUnits = filteredUnits.filter(p => p['المدينة'] === cityName);
        }

        if (propertyName) {
            filteredUnits = filteredUnits.filter(p => p['اسم العقار'] === propertyName);
        }

        return {
            units: filteredUnits,
            count: filteredUnits.length,
            byCity: this.groupByCity(filteredUnits),
            byProperty: this.groupByProperty(filteredUnits)
        };
    }

    // تجميع حسب المدينة
    groupByCity(units) {
        const grouped = {};
        units.forEach(unit => {
            const city = unit['المدينة'] || 'غير محدد';
            if (!grouped[city]) {
                grouped[city] = [];
            }
            grouped[city].push(unit);
        });
        return grouped;
    }

    // تجميع حسب العقار
    groupByProperty(units) {
        const grouped = {};
        units.forEach(unit => {
            const property = unit['اسم العقار'] || 'غير محدد';
            if (!grouped[property]) {
                grouped[property] = [];
            }
            grouped[property].push(unit);
        });
        return grouped;
    }

    // الحصول على البيانات المالية
    getFinancialData(cityName = null, propertyName = null) {
        let relevantUnits = properties;

        if (cityName) {
            relevantUnits = relevantUnits.filter(p => p['المدينة'] === cityName);
        }

        if (propertyName) {
            relevantUnits = relevantUnits.filter(p => p['اسم العقار'] === propertyName);
        }

        const occupiedUnits = relevantUnits.filter(p => p['حالة الوحدة'] === 'مؤجر');

        // حساب الإيرادات (إذا كانت متوفرة في البيانات)
        let totalRevenue = 0;
        let averageRent = 0;
        let rentCount = 0;

        occupiedUnits.forEach(unit => {
            const rent = parseFloat(unit['قيمة الإيجار'] || unit['الإيجار'] || 0);
            if (rent > 0) {
                totalRevenue += rent;
                rentCount++;
            }
        });

        if (rentCount > 0) {
            averageRent = Math.round(totalRevenue / rentCount);
        }

        return {
            totalRevenue,
            averageRent,
            occupiedUnits: occupiedUnits.length,
            potentialRevenue: averageRent * relevantUnits.length,
            revenueEfficiency: relevantUnits.length > 0 ? Math.round((totalRevenue / (averageRent * relevantUnits.length)) * 100) : 0
        };
    }

    // تحليل الاتجاهات
    analyzeTrends() {
        const cities = this.getUniqueCountries().filter(c => c !== 'الكل');
        const trends = {
            bestPerformingCities: [],
            worstPerformingCities: [],
            recommendations: []
        };

        const cityPerformance = cities.map(city => {
            const stats = this.calculateCityStats(city);
            return {
                city,
                occupancyRate: stats.occupancyRate,
                totalUnits: stats.totalUnits
            };
        }).sort((a, b) => b.occupancyRate - a.occupancyRate);

        trends.bestPerformingCities = cityPerformance.slice(0, 3);
        trends.worstPerformingCities = cityPerformance.slice(-3).reverse();

        // توصيات ذكية
        if (trends.worstPerformingCities.length > 0) {
            trends.recommendations.push('ركز على تحسين التسويق في المدن ذات الإشغال المنخفض');
        }

        return trends;
    }

    // أفضل المدن حسب الإشغال
    getTopCitiesByOccupancy() {
        const cities = this.getUniqueCountries().filter(c => c !== 'الكل');
        return cities.map(city => {
            const stats = this.calculateCityStats(city);
            return {
                city,
                occupancyRate: stats.occupancyRate,
                totalUnits: stats.totalUnits
            };
        }).sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 5);
    }

    // أفضل العقارات حسب الإشغال
    getTopPropertiesByOccupancy() {
        const properties = this.getUniqueProperties();
        return properties.map(property => {
            const stats = this.calculatePropertyStats(property);
            return {
                property,
                occupancyRate: stats.occupancyRate,
                totalUnits: stats.totalUnits,
                city: stats.city
            };
        }).sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 5);
    }

    // رد احتياطي محسن مع البحث الشامل
    async getFallbackResponse(message) {
        const normalizedMessage = this.normalizeArabicText(message);

        // البحث عن أرقام في الرسالة للبحث الشامل
        const numberPattern = /\d{8,}/g;
        const numbers = message.match(numberPattern);

        if (numbers && numbers.length > 0) {
            for (const number of numbers) {
                const searchResults = await this.comprehensiveSearch(number);
                if (searchResults.properties.length > 0) {
                    const property = searchResults.properties[0];

                    // استخدام البيانات الصحيحة
                    const propertyName = property['اسم العقار'] || 'غير محدد';
                    const city = property['المدينة'] || 'غير محدد';
                    const unitNumber = property['رقم الوحدة'] || 'غير محدد';
                    const tenantName = property['اسم المستأجر'] || 'فارغ';
                    const contractNumber = property['رقم العقد'] || 'غير محدد';
                    const unitStatus = property['حالة الوحدة'] || (property['اسم المستأجر'] ? 'مؤجر' : 'فارغ');
                    const startDate = property['تاريخ بداية العقد'] || 'غير محدد';
                    const endDate = property['تاريخ نهاية العقد'] || 'غير محدد';

                    // استخدام الإجمالي بدلاً من القيمة الشهرية
                    const totalAmount = property['الإجمالي'] || property['قيمة الإيجار'] || 'غير محدد';
                    const monthlyRent = property['قيمة الإيجار'] || 'غير محدد';

                    let response = `🔍 وجدت نتائج للرقم ${number}:

📋 تفاصيل الوحدة:
• العقار: ${propertyName}
• المدينة: ${city}
• رقم الوحدة: ${unitNumber}
• المستأجر: ${tenantName}
• رقم العقد: ${contractNumber}
• الحالة: ${unitStatus}
• تاريخ بداية العقد: ${startDate}
• تاريخ نهاية العقد: ${endDate}
• إجمالي قيمة العقد: ${totalAmount} ريال`;

                    // إضافة القيمة الشهرية إذا كانت مختلفة عن الإجمالي
                    if (monthlyRent !== 'غير محدد' && monthlyRent !== totalAmount) {
                        response += `\n• القيمة الشهرية: ${monthlyRent} ريال`;
                    }

                    // إضافة معلومات إضافية
                    if (property['المالك']) {
                        response += `\n• المالك: ${property['المالك']}`;
                    }
                    if (property['رقم جوال المستأجر']) {
                        response += `\n• جوال المستأجر: ${property['رقم جوال المستأجر']}`;
                    }
                    if (property['المساحة']) {
                        response += `\n• المساحة: ${property['المساحة']} متر مربع`;
                    }

                    if (searchResults.properties.length > 1) {
                        response += `\n\n🔍 وجدت ${searchResults.properties.length - 1} نتيجة إضافية`;
                    }

                    return response;
                }
            }
        }

        // محاولة تحليل الطلب وتقديم رد ذكي
        const dataSource = this.databaseData.properties.length > 0 ? this.databaseData.properties : properties;

        const cityData = this.findCityInMessage(normalizedMessage, dataSource);
        if (cityData) {
            const stats = this.calculateCityStats(cityData.name, dataSource);
            return `📊 إحصائيات ${cityData.name}:

• إجمالي الوحدات: ${stats.totalUnits} وحدة
• الوحدات المؤجرة: ${stats.occupiedUnits} وحدة (${stats.occupancyRate}%)
• الوحدات الفارغة: ${stats.vacantUnits} وحدة (${stats.vacancyRate}%)
• عدد العقارات: ${stats.propertiesCount} عقار`;
        }

        const tenantData = this.findTenantInMessage(normalizedMessage, dataSource);
        if (tenantData.found) {
            let response = `👤 وجدت ${tenantData.units.length} وحدة للمستأجرين المطابقين:\n\n`;

            // عرض أسماء المستأجرين
            tenantData.tenantNames.forEach((name, index) => {
                response += `${index + 1}. ${name}\n`;
            });

            response += `\n📍 المدن: ${tenantData.stats.cities.join(', ')}\n`;
            response += `🏢 العقارات: ${tenantData.stats.propertiesCount} عقار\n\n`;

            // عرض تفاصيل الوحدات
            response += `📋 تفاصيل الوحدات:\n`;
            tenantData.units.slice(0, 3).forEach((unit, index) => {
                response += `\n${index + 1}. العقار: ${unit['اسم العقار'] || 'غير محدد'}\n`;
                response += `   المدينة: ${unit['المدينة'] || 'غير محدد'}\n`;
                response += `   رقم الوحدة: ${unit['رقم الوحدة'] || 'غير محدد'}\n`;
                response += `   رقم العقد: ${unit['رقم العقد'] || 'غير محدد'}\n`;
                response += `   الحالة: ${unit['حالة الوحدة'] || (unit['اسم المستأجر'] ? 'مؤجر' : 'فارغ')}\n`;

                if (unit['الإجمالي']) {
                    response += `   إجمالي العقد: ${unit['الإجمالي']} ريال\n`;
                }
                if (unit['قيمة الإيجار'] && unit['قيمة الإيجار'] !== unit['الإجمالي']) {
                    response += `   القيمة الشهرية: ${unit['قيمة الإيجار']} ريال\n`;
                }
                if (unit['تاريخ بداية العقد']) {
                    response += `   تاريخ البداية: ${unit['تاريخ بداية العقد']}\n`;
                }
                if (unit['تاريخ نهاية العقد']) {
                    response += `   تاريخ النهاية: ${unit['تاريخ نهاية العقد']}\n`;
                }
            });

            if (tenantData.units.length > 3) {
                response += `\n... و ${tenantData.units.length - 3} وحدة أخرى`;
            }

            return response;
        }

        const unitData = this.findUnitInMessage(normalizedMessage, dataSource);
        if (unitData.found) {
            let response = `🏠 تفاصيل الوحدة:\n\n`;

            unitData.units.slice(0, 2).forEach((unit, index) => {
                if (index > 0) response += '\n---\n\n';

                response += `📋 الوحدة ${index + 1}:\n`;
                response += `• رقم الوحدة: ${unit['رقم الوحدة'] || 'غير محدد'}\n`;
                response += `• العقار: ${unit['اسم العقار'] || 'غير محدد'}\n`;
                response += `• المدينة: ${unit['المدينة'] || 'غير محدد'}\n`;
                response += `• المستأجر: ${unit['اسم المستأجر'] || 'فارغ'}\n`;
                response += `• رقم العقد: ${unit['رقم العقد'] || 'غير محدد'}\n`;
                response += `• الحالة: ${unit['حالة الوحدة'] || (unit['اسم المستأجر'] ? 'مؤجر' : 'فارغ')}\n`;

                if (unit['الإجمالي']) {
                    response += `• إجمالي العقد: ${unit['الإجمالي']} ريال\n`;
                }
                if (unit['قيمة الإيجار'] && unit['قيمة الإيجار'] !== unit['الإجمالي']) {
                    response += `• القيمة الشهرية: ${unit['قيمة الإيجار']} ريال\n`;
                }
                if (unit['تاريخ بداية العقد']) {
                    response += `• تاريخ البداية: ${unit['تاريخ بداية العقد']}\n`;
                }
                if (unit['تاريخ نهاية العقد']) {
                    response += `• تاريخ النهاية: ${unit['تاريخ نهاية العقد']}\n`;
                }
                if (unit['المالك']) {
                    response += `• المالك: ${unit['المالك']}\n`;
                }
                if (unit['رقم جوال المستأجر']) {
                    response += `• جوال المستأجر: ${unit['رقم جوال المستأجر']}\n`;
                }
                if (unit['المساحة']) {
                    response += `• المساحة: ${unit['المساحة']} متر مربع\n`;
                }
            });

            if (unitData.count > 2) {
                response += `\n🔍 وجدت ${unitData.count - 2} وحدة إضافية مطابقة`;
            }

            return response;
        }

        const queryType = this.analyzeQueryType(normalizedMessage);
        if (queryType.isStatistics) {
            const stats = this.getGeneralStatistics(dataSource);
            return `📊 إحصائيات عامة:

• إجمالي العقارات: ${stats.totalProperties} عقار
• إجمالي الوحدات: ${stats.totalUnits} وحدة
• الوحدات المؤجرة: ${stats.occupiedUnits} وحدة (${stats.occupancyRate}%)
• الوحدات الفارغة: ${stats.vacantUnits} وحدة (${stats.vacancyRate}%)
• عدد المدن: ${stats.citiesCount} مدينة`;
        }

        return `عذراً، لم أتمكن من فهم طلبك بدقة. يمكنك أن تسأل عن:

🔢 أرقام العقود: "رقم العقد 20245810915"
🏙️ المدن: "إحصائيات الرياض"
🏢 العقارات: "وحدات عمارة النسيم"
🏠 الوحدات: "وحدة A101"
👥 المستأجرين: "أبو خالد"
📊 الإحصائيات: "كم عدد الوحدات الفارغة؟"
💰 المالية: "الإيرادات الشهرية"

💡 نصيحة: يمكنك البحث بأي رقم عقد أو رقم وحدة أو اسم مستأجر`;
    }

    // إضافة رسالة المستخدم
    addUserMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(message)}</div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // إضافة رسالة البوت
    addBotMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-bubble">
                <div class="message-content">${this.formatMessage(message)}</div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // إضافة أسئلة سريعة
    addQuickQuestions(questions) {
        const messagesContainer = document.getElementById('chatMessages');
        const questionsDiv = document.createElement('div');
        questionsDiv.className = 'quick-questions';
        questionsDiv.innerHTML = `
            <div class="quick-questions-title">أسئلة سريعة:</div>
            <div class="quick-questions-buttons">
                ${questions.map(q => `<button onclick="chatBot.askQuickQuestion('${q}')">${q}</button>`).join('')}
            </div>
        `;
        messagesContainer.appendChild(questionsDiv);
        this.scrollToBottom();
    }

    // سؤال سريع
    askQuickQuestion(question) {
        const input = document.getElementById('chatInput');
        input.value = question;
        this.sendMessage();
    }

    // تنسيق الرسالة
    formatMessage(message) {
        // تحويل الأسطر الجديدة إلى <br>
        message = message.replace(/\n/g, '<br>');

        // تنسيق النقاط
        message = message.replace(/•/g, '<span class="bullet">•</span>');

        // تنسيق الأرقام والنسب
        message = message.replace(/(\d+%)/g, '<span class="percentage">$1</span>');
        message = message.replace(/(\d+)\s*(عقار|وحدة|مدينة)/g, '<span class="number">$1</span> $2');

        return message;
    }

    // الحصول على الوقت الحالي
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // إظهار مؤشر الكتابة
    showTyping() {
        const typingIndicator = document.getElementById('chatbotTyping');
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            this.isTyping = true;
            this.scrollToBottom();
        }
    }

    // إخفاء مؤشر الكتابة
    hideTyping() {
        const typingIndicator = document.getElementById('chatbotTyping');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
            this.isTyping = false;
        }
    }

    // التمرير للأسفل
    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
    }

    // الحصول على العقارات الفريدة
    getUniqueProperties(dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);
        const uniqueProperties = new Set();
        data.forEach(property => {
            const propertyName = property['اسم العقار'] || property['اسم_العقار'] || '';
            if (propertyName && propertyName.trim() !== '') {
                uniqueProperties.add(propertyName);
            }
        });
        return Array.from(uniqueProperties);
    }

    // الحصول على المدن الفريدة
    getUniqueCountries(dataSource = null) {
        const data = dataSource || (this.databaseData.properties.length > 0 ? this.databaseData.properties : properties);
        const uniqueCountries = new Set();
        data.forEach(property => {
            const cityName = property['المدينة'] || property['المدينه'] || '';
            if (cityName && cityName.trim() !== '') {
                uniqueCountries.add(cityName);
            }
        });
        return Array.from(uniqueCountries).sort();
    }

    // تحديث البيانات من قاعدة البيانات
    async refreshDatabaseData() {
        if (this.supabaseClient) {
            console.log('🔄 تحديث البيانات من قاعدة البيانات...');
            await this.loadDatabaseData();
            console.log('✅ تم تحديث البيانات بنجاح');
        }
    }

    // البحث الشامل في جميع البيانات
    async comprehensiveSearch(searchTerm) {
        const results = {
            properties: [],
            contracts: [],
            installments: [],
            searchTerm: searchTerm
        };

        // البحث في العقارات
        const localResults = this.searchInLocalData(searchTerm);
        if (localResults.found) {
            results.properties = localResults.results;
        }

        // البحث في قاعدة البيانات
        if (this.supabaseClient) {
            const dbResults = await this.searchInDatabase(searchTerm);
            if (dbResults.found) {
                // دمج النتائج وإزالة المكررات
                const existingIds = new Set(results.properties.map(p => p.id));
                const newResults = dbResults.results.filter(r => !existingIds.has(r.id));
                results.properties.push(...newResults);
            }
        }

        // البحث في العقود
        if (this.databaseData.contracts.length > 0) {
            results.contracts = this.databaseData.contracts.filter(contract => {
                return Object.values(contract).some(value => {
                    if (value && typeof value === 'string') {
                        return this.normalizeArabicText(value).includes(this.normalizeArabicText(searchTerm));
                    }
                    return false;
                });
            });
        }

        // البحث في الأقساط
        if (this.databaseData.installments.length > 0) {
            results.installments = this.databaseData.installments.filter(installment => {
                return Object.values(installment).some(value => {
                    if (value && typeof value === 'string') {
                        return this.normalizeArabicText(value).includes(this.normalizeArabicText(searchTerm));
                    }
                    return false;
                });
            });
        }

        return results;
    }
}

// تهيئة الشات بوت عند تحميل الصفحة
let chatBot;

// تهيئة الشات بوت معطلة مؤقتاً
async function initializeChatBot() {
    console.log('🔒 الشات بوت معطل مؤقتاً - لن يتم تهيئته');
    return;

    // الكود المعطل:
    /*
    // فحص الصلاحيات أولاً
    const hasPermission = checkChatBotPermissions();
    if (!hasPermission) {
        console.log('🔒 الشات بوت مخصص لعمر فقط - لن يتم تهيئته');
        return;
    }

    if (typeof properties !== 'undefined' && properties.length > 0) {
        try {
            console.log('🚀 بدء تهيئة الشات بوت مع Gemini 2.0 Flash لعمر...');
            chatBot = new RealEstateChatBot();
            await chatBot.init(); // انتظار التهيئة الكاملة
            console.log('✅ تم تهيئة الشات بوت الذكي بنجاح لعمر مع جميع المميزات المتقدمة');
        } catch (error) {
            console.error('❌ خطأ في تهيئة الشات بوت:', error);
            // إنشاء نسخة احتياطية
            chatBot = new RealEstateChatBot();
            console.log('⚠️ تم تهيئة الشات بوت في الوضع الاحتياطي');
        }
    } else {
        console.log('⏳ انتظار تحميل البيانات لتهيئة الشات بوت...');
        setTimeout(initializeChatBot, 1000);
    }
    */
}

// فحص صلاحيات الشات بوت (دالة مساعدة)
function checkChatBotPermissions() {
    try {
        // فحص المستخدم الحالي من localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            if (userData.username === 'عمر') {
                return true;
            }
        }

        // فحص المستخدم من المتغير العام
        if (typeof currentUser !== 'undefined' && currentUser === 'عمر') {
            return true;
        }

        // فحص إذا كان المستخدم مدير
        if (typeof users !== 'undefined' && typeof currentUser !== 'undefined') {
            const user = users[currentUser];
            if (user && (user.role === 'admin' || user.username === 'عمر')) {
                return true;
            }
        }

        // فحص كلاس user-omar
        if (document.body.classList.contains('user-omar')) {
            return true;
        }

        return false;

    } catch (error) {
        console.error('❌ خطأ في فحص صلاحيات الشات بوت:', error);
        return false;
    }
}

// تهيئة الشات بوت عند تحميل الصفحة - معطلة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔒 الشات بوت معطل - لن يتم تحميله');
    // setTimeout(initializeChatBot, 2000);

    // مراقبة تغيير المستخدم - معطلة
    // setupGlobalUserChangeListener();
});

// إعداد مراقب تغيير المستخدم العام
function setupGlobalUserChangeListener() {
    // مراقبة تغيير localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'currentUser') {
            handleGlobalUserChange();
        }
    });

    // مراقبة تغيير كلاس user-omar
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                handleGlobalUserChange();
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });

    // فحص دوري كل 3 ثوان
    setInterval(() => {
        handleGlobalUserChange();
    }, 3000);
}

// معالجة تغيير المستخدم العام
function handleGlobalUserChange() {
    const hasPermission = checkChatBotPermissions();

    if (hasPermission) {
        // إذا لم يكن الشات بوت موجود، قم بإنشاؤه
        if (!window.chatBot) {
            console.log('✅ المستخدم عمر - تهيئة الشات بوت...');
            initializeChatBot();
        } else {
            // إظهار الشات بوت الموجود
            const chatToggle = document.getElementById('chatbotToggle');
            if (chatToggle) {
                chatToggle.style.display = 'flex';
                console.log('✅ تم إظهار الشات بوت - المستخدم عمر');
            }
        }
    } else {
        // إخفاء الشات بوت
        const chatToggle = document.getElementById('chatbotToggle');
        const chatContainer = document.getElementById('chatbotContainer');

        if (chatToggle) {
            chatToggle.style.display = 'none';
            console.log('🔒 تم إخفاء الشات بوت - المستخدم غير مخول (مخصص لعمر فقط)');
        }

        if (chatContainer && window.chatBot && window.chatBot.isOpen) {
            window.chatBot.closeChatbot();
        }
    }
}

// تصدير للاستخدام العام
window.chatBot = chatBot;
