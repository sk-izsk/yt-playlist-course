"use client";

import { Result, Skeleton } from "antd";
import { use } from "react";
import { useCourse } from "@/client/hooks/useCourse";
import { Crumbs } from "@/components/common/Crumbs";
import { CourseProgress } from "@/components/course/CourseProgress";
import { CourseUpdateBanner } from "@/components/course/CourseUpdateBanner";
import { CourseHeader } from "@/components/course/CourseHeader";
import { DayPlan } from "@/components/course/DayPlan";

const CoursePage = ({ params }: PageProps<"/courses/[token]">) => {
  const { token } = use(params);
  const { data: course, isLoading, error } = useCourse(token);

  return (
    <div className="container" style={{ paddingBlock: "48px 96px" }}>
      {isLoading && <Skeleton active avatar paragraph={{ rows: 8 }} />}
      {error && <Result status="404" title="Course not found" subTitle={token} />}
      {course && (
        <>
          <Crumbs items={[{ label: "Courses", href: "/#courses" }, { label: course.title }]} />
          <CourseHeader course={course} />
          <CourseUpdateBanner course={course} />
          <CourseProgress course={course} />
          <DayPlan lessons={course.lessons} />
        </>
      )}
    </div>
  );
}

export default CoursePage;
