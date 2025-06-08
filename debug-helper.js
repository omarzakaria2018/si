// ===== DEBUG HELPER FOR NETLIFY DEPLOYMENT =====
// This file helps diagnose issues with the deployed application

// Global debug object
window.RealEstateDebug = {
    // Check if all required files are loaded
    checkFilesLoaded: function() {
        console.log('🔍 Checking if all required files are loaded...');
        
        const checks = {
            'Supabase Library': typeof supabase !== 'undefined',
            'Supabase Config': typeof initSupabase === 'function',
            'Data Migration': typeof initializeDataLoading === 'function',
            'Main Script': typeof properties !== 'undefined',
            'XLSX Library': typeof XLSX !== 'undefined'
        };
        
        console.table(checks);
        
        const allLoaded = Object.values(checks).every(check => check);
        if (allLoaded) {
            console.log('✅ All required files are loaded');
        } else {
            console.error('❌ Some files are missing or not loaded properly');
        }
        
        return checks;
    },
    
    // Check Supabase connection
    checkSupabaseConnection: async function() {
        console.log('🔍 Checking Supabase connection...');
        
        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            return false;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('properties')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.error('❌ Supabase connection failed:', error);
                return false;
            } else {
                console.log('✅ Supabase connection successful');
                return true;
            }
        } catch (error) {
            console.error('❌ Supabase connection error:', error);
            return false;
        }
    },
    
    // Check data persistence
    checkDataPersistence: async function() {
        console.log('🔍 Testing data persistence...');
        
        if (!supabaseClient) {
            console.error('❌ Cannot test persistence - Supabase not connected');
            return false;
        }
        
        try {
            // Try to add a test property
            const testProperty = {
                unit_number: 'TEST_' + Date.now(),
                city: 'Test City',
                property_name: 'Test Property',
                owner: 'Test Owner'
            };
            
            console.log('📝 Adding test property...');
            const addResult = await addProperty(testProperty);
            
            if (!addResult) {
                console.error('❌ Failed to add test property');
                return false;
            }
            
            console.log('✅ Test property added successfully');
            
            // Try to retrieve it
            console.log('📖 Retrieving test property...');
            const { data, error } = await supabaseClient
                .from('properties')
                .select('*')
                .eq('unit_number', testProperty.unit_number)
                .single();
            
            if (error || !data) {
                console.error('❌ Failed to retrieve test property:', error);
                return false;
            }
            
            console.log('✅ Test property retrieved successfully');
            
            // Clean up - delete test property
            console.log('🗑️ Cleaning up test property...');
            await deleteProperty(data.id);
            
            console.log('✅ Data persistence test completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Data persistence test failed:', error);
            return false;
        }
    },
    
    // Check file upload functionality
    checkFileUpload: async function() {
        console.log('🔍 Checking file upload functionality...');
        
        if (!supabaseClient) {
            console.error('❌ Cannot test file upload - Supabase not connected');
            return false;
        }
        
        try {
            // Create a small test file
            const testContent = 'This is a test file for debugging';
            const testFile = new Blob([testContent], { type: 'text/plain' });
            testFile.name = 'debug_test_' + Date.now() + '.txt';
            
            console.log('📤 Testing file upload...');
            const uploadResult = await uploadFile(testFile, 'DEBUG_TEST');
            
            if (!uploadResult) {
                console.error('❌ File upload test failed');
                return false;
            }
            
            console.log('✅ File upload test successful');
            
            // Clean up - delete test file
            console.log('🗑️ Cleaning up test file...');
            await deleteAttachment(uploadResult.id);
            
            console.log('✅ File upload test completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ File upload test failed:', error);
            return false;
        }
    },
    
    // Run all diagnostic tests
    runFullDiagnostic: async function() {
        console.log('🚀 Running full diagnostic...');
        console.log('='.repeat(50));
        
        const results = {
            filesLoaded: this.checkFilesLoaded(),
            supabaseConnection: await this.checkSupabaseConnection(),
            dataPersistence: await this.checkDataPersistence(),
            fileUpload: await this.checkFileUpload()
        };
        
        console.log('='.repeat(50));
        console.log('📊 DIAGNOSTIC RESULTS:');
        console.table(results);
        
        const allPassed = Object.values(results).every(result => 
            typeof result === 'object' ? Object.values(result).every(Boolean) : result
        );
        
        if (allPassed) {
            console.log('🎉 All tests passed! The system should be working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please check the issues above.');
        }
        
        return results;
    },
    
    // Show current system status
    showStatus: function() {
        console.log('📊 CURRENT SYSTEM STATUS:');
        console.log('Supabase Client:', supabaseClient ? '✅ Connected' : '❌ Not Connected');
        console.log('Properties Array:', properties ? `✅ Loaded (${properties.length} items)` : '❌ Not Loaded');
        console.log('Real-time Subscription:', propertySubscription ? '✅ Active' : '❌ Inactive');
        console.log('Current URL:', window.location.href);
        console.log('User Agent:', navigator.userAgent);
    },
    
    // Force reload data from Supabase
    forceReloadData: async function() {
        console.log('🔄 Force reloading data from Supabase...');
        try {
            await loadAndDisplayProperties();
            console.log('✅ Data reloaded successfully');
        } catch (error) {
            console.error('❌ Failed to reload data:', error);
        }
    },
    
    // Force save all current data to Supabase
    forceSaveData: async function() {
        console.log('💾 Force saving all data to Supabase...');
        try {
            await autoSaveAllProperties();
            console.log('✅ Data saved successfully');
        } catch (error) {
            console.error('❌ Failed to save data:', error);
        }
    }
};

// Auto-run basic checks when this file loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔧 Debug Helper Loaded');
        console.log('Use RealEstateDebug.runFullDiagnostic() to run all tests');
        console.log('Use RealEstateDebug.showStatus() to see current status');
        
        // Auto-check files loaded
        RealEstateDebug.checkFilesLoaded();
    }, 3000);
});

console.log('🔧 Real Estate Debug Helper loaded. Use RealEstateDebug object for diagnostics.');
