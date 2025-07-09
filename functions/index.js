const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// دالة لجلب كل المستخدمين من Firebase Authentication
exports.listUsers = functions.https.onCall(async (data, context) => {
  // التحقق من أن الطلب قادم من مستخدم مسجل دخوله
  // يمكنك إضافة المزيد من التحققات هنا، مثلاً التحقق إذا كان المستخدم مديراً
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "يجب أن تكون مسجلاً للدخول لعرض المستخدمين."
    );
  }

  try {
    const userRecords = await admin.auth().listUsers(1000); // جلب 1000 مستخدم كحد أقصى
    const users = userRecords.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
    }));
    return { users };
  } catch (error) {
    console.error("Error listing users:", error);
    throw new functions.https.HttpsError(
      "internal",
      "حدث خطأ أثناء جلب قائمة المستخدمين."
    );
  }
});

exports.syncStudentBasicInfo = functions.firestore
  .document("students/{studentId}")
  .onWrite(async (change, context) => {
    const studentId = context.params.studentId;

    const newData = change.after.exists ? change.after.data() : null;

    if (!newData) {
      // المستند تم حذفه → نحذفه من cache أيضاً
      await db.collection("cache").doc("all_students_basic_info").update({
        [studentId]: admin.firestore.FieldValue.delete()
      });
      console.log(`🚫 حذف الطالب ${studentId} من مستند الملخص`);
      return;
    }

    const info = newData.personalInfo || {};

    const basicInfo = {
      id: studentId,
      registrationNumber: info.registrationNumber || "",
      name: info.name || "",
      fatherName: info.fatherName || "",
      acceptedClass: info.acceptedClass || "",
      currentClass: info.currentClass || "",
    };

    // نضيف أو نحدث السجل داخل المستند المركزي
    await db.collection("cache").doc("all_students_basic_info").set(
      { [studentId]: basicInfo },
      { merge: true } // حتى نحدث فقط طالب واحد بدون حذف الباقين
    );

    console.log(`✅ تم تحديث معلومات الطالب ${studentId} في الملخص`);
    return;
  });

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = data.uid;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "uid" argument.');
  }

  try {
    // Delete the user from Firebase Authentication
    await admin.auth().deleteUser(uid);

    // Delete the user's document from Firestore
    await db.collection('users').doc(uid).delete();

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Unable to delete user.');
  }
});
