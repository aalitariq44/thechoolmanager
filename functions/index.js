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
