import React, { useState, useEffect } from 'react'
import ss from './Dashboard.module.css'
import { IoClose } from "react-icons/io5"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: '12:00', views: 4000, likes: 2400 },
    { name: '13:00', views: 3000, likes: 1398 },
    { name: '14:00', views: 2000, likes: 9800 },
    { name: '15:00', views: 2780, likes: 3908 },
    { name: '16:00', views: 1890, likes: 4800 },
    { name: '17:00', views: 2390, likes: 3800 },
    { name: '18:00', views: 3490, likes: 4300 },
];

const postStatusData = {
    public: 85,
    private: 15,
    total: 100
};

const teamProjects = [
    { name: "Brand Identity", progress: 75, members: 4, dueDate: "2024-04-15" },
    { name: "Website Redesign", progress: 40, members: 3, dueDate: "2024-04-20" },
    { name: "Mobile App UI", progress: 90, members: 5, dueDate: "2024-04-10" },
];

const recentPosts = [
    { title: "Chromatic Dreams", views: 1240, likes: 89, time: "2 hours ago" },
    { title: "Urban Landscapes", views: 856, likes: 67, time: "5 hours ago" },
    { title: "Abstract Harmony", views: 2300, likes: 156, time: "1 day ago" },
];

const engagementHours = [
    { hour: '00:00', engagement: 120 },
    { hour: '03:00', engagement: 80 },
    { hour: '06:00', engagement: 150 },
    { hour: '09:00', engagement: 450 },
    { hour: '12:00', engagement: 780 },
    { hour: '15:00', engagement: 690 },
    { hour: '18:00', engagement: 890 },
    { hour: '21:00', engagement: 320 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className={ss.custom_tooltip}>
                <p className={ss.tooltip_time}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className={ss.tooltip_value} style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard = ({ onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        // 모달이 DOM에 마운트된 직후에 visible 클래스 추가
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // 애니메이션이 완료된 후에 모달 닫기
        setTimeout(() => {
            onClose();
        }, 300); // CSS 트랜지션 시간과 동일하게 설정
    };

    return (
        <div className={`${ss.modal_overlay} ${isVisible ? ss.overlayVisible : ''}`}
             onClick={e => e.target === e.currentTarget && handleClose()}>
            <div className={`${ss.modal_content} ${isVisible ? ss.modalVisible : ''}`}>
                <div className={ss.modal_header}>
                    <h1 className={ss.header_title}>Dashboard</h1>
                    <button className={ss.close_btn} onClick={handleClose}>
                        <IoClose />
                    </button>
                </div>

                <div className={ss.modal_body}>
                    <div className={ss.stats_grid}>
                        <div className={ss.stat_card}>
                            <h3>Total Views</h3>
                            <p className={ss.stat_number}>12.5K</p>
                            <span className={`${ss.stat_trend} ${ss.positive}`}>+15%</span>
                        </div>
                        <div className={ss.stat_card}>
                            <h3>Total Likes</h3>
                            <p className={ss.stat_number}>8.2K</p>
                            <span className={`${ss.stat_trend} ${ss.positive}`}>+23%</span>
                        </div>
                        <div className={ss.stat_card}>
                            <h3>Total Posts</h3>
                            <p className={ss.stat_number}>156</p>
                            <span className={`${ss.stat_trend} ${ss.positive}`}>+8%</span>
                        </div>
                        <div className={ss.stat_card}>
                            <h3>Engagement Rate</h3>
                            <p className={ss.stat_number}>4.8%</p>
                            <span className={`${ss.stat_trend} ${ss.negative}`}>-2%</span>
                        </div>
                    </div>

                    <div className={ss.chart_section}>
                        <h2>Activity Overview</h2>
                        <div className={ss.chart_container}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart
                                    data={data}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 20,
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2196F3" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        vertical={false}
                                        stroke="rgba(255,255,255,0.05)"
                                    />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="#4CAF50"
                                        strokeWidth={2}
                                        fill="url(#colorViews)"
                                        dot={{ stroke: '#4CAF50', strokeWidth: 2, r: 4, fill: '#171717' }}
                                        activeDot={{ stroke: '#4CAF50', strokeWidth: 2, r: 6, fill: '#171717' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="likes"
                                        stroke="#2196F3"
                                        strokeWidth={2}
                                        fill="url(#colorLikes)"
                                        dot={{ stroke: '#2196F3', strokeWidth: 2, r: 4, fill: '#171717' }}
                                        activeDot={{ stroke: '#2196F3', strokeWidth: 2, r: 6, fill: '#171717' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className={ss.chart_legend}>
                                <div className={ss.legend_item}>
                                    <span className={`${ss.legend_color} ${ss.views}`}></span>
                                    <span>Views</span>
                                </div>
                                <div className={ss.legend_item}>
                                    <span className={`${ss.legend_color} ${ss.likes}`}></span>
                                    <span>Likes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={ss.posts_section}>
                        <h2>Content Overview</h2>
                        <div className={ss.posts_grid}>
                            <div className={ss.post_status_card}>
                                <div className={ss.status_header}>
                                    <h3>Post Status</h3>
                                    <span className={ss.total_posts}>Total Posts: {postStatusData.total}</span>
                                </div>
                                <div className={ss.status_bar_container}>
                                    <div 
                                        className={ss.status_bar_public}
                                        style={{ width: `${postStatusData.public}%` }}
                                    >
                                        <span className={ss.status_label}>
                                            Public ({postStatusData.public}%)
                                        </span>
                                    </div>
                                    <div 
                                        className={ss.status_bar_private}
                                        style={{ width: `${postStatusData.private}%` }}
                                    >
                                        <span className={ss.status_label}>
                                            Private ({postStatusData.private}%)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={ss.post_metrics_card}>
                                <h3>Post Performance</h3>
                                <div className={ss.metrics_grid}>
                                    <div className={ss.metric_item}>
                                        <span className={ss.metric_label}>Avg. Views</span>
                                        <span className={ss.metric_value}>2.4K</span>
                                    </div>
                                    <div className={ss.metric_item}>
                                        <span className={ss.metric_label}>Avg. Likes</span>
                                        <span className={ss.metric_value}>342</span>
                                    </div>
                                    <div className={ss.metric_item}>
                                        <span className={ss.metric_label}>Comments</span>
                                        <span className={ss.metric_value}>89</span>
                                    </div>
                                    <div className={ss.metric_item}>
                                        <span className={ss.metric_label}>Shares</span>
                                        <span className={ss.metric_value}>56</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={ss.team_section}>
                        <h2>Team Projects</h2>
                        <div className={ss.projects_grid}>
                            {teamProjects.map((project, index) => (
                                <div key={index} className={ss.project_card}>
                                    <div className={ss.project_header}>
                                        <h3>{project.name}</h3>
                                        <span className={ss.due_date}>Due: {project.dueDate}</span>
                                    </div>
                                    <div className={ss.progress_container}>
                                        <div 
                                            className={ss.progress_bar}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                        <span className={ss.progress_label}>{project.progress}%</span>
                                    </div>
                                    <div className={ss.project_footer}>
                                        <span className={ss.members_count}>
                                            {project.members} team members
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={ss.engagement_section}>
                        <h2>Best Engagement Hours</h2>
                        <div className={ss.engagement_card}>
                            <div className={ss.hour_bars}>
                                {engagementHours.map((item, index) => (
                                    <div key={index} className={ss.hour_bar_container}>
                                        <div 
                                            className={ss.hour_bar}
                                            style={{ height: `${(item.engagement / 900) * 100}%` }}
                                        />
                                        <span className={ss.hour_label}>{item.hour}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={ss.peak_hours}>
                                <div className={ss.peak_hour_item}>
                                    <span className={ss.peak_label}>Peak Hour</span>
                                    <span className={ss.peak_value}>18:00</span>
                                    <span className={ss.peak_engagement}>890 engagements</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={ss.recent_posts_section}>
                        <h2>Recent Posts Performance</h2>
                        <div className={ss.posts_list}>
                            {recentPosts.map((post, index) => (
                                <div key={index} className={ss.post_performance_card}>
                                    <div className={ss.post_info}>
                                        <h3>{post.title}</h3>
                                        <span className={ss.post_time}>{post.time}</span>
                                    </div>
                                    <div className={ss.post_stats}>
                                        <div className={ss.stat_group}>
                                            <span className={ss.stat_icon}>👁️</span>
                                            <span className={ss.stat_value}>{post.views.toLocaleString()}</span>
                                        </div>
                                        <div className={ss.stat_group}>
                                            <span className={ss.stat_icon}>❤️</span>
                                            <span className={ss.stat_value}>{post.likes}</span>
                                        </div>
                                        <div className={`${ss.engagement_rate} ${post.likes/post.views > 0.05 ? ss.high_rate : ss.normal_rate}`}>
                                            {((post.likes/post.views) * 100).toFixed(1)}% Engagement
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={ss.achievements_section}>
                        <h2>Achievements</h2>
                        <div className={ss.achievements_grid}>
                            <div className={ss.achievement_card}>
                                <span className={ss.achievement_icon}>🏆</span>
                                <h3>Top Creator</h3>
                                <p>Ranked in top 5% this month</p>
                            </div>
                            <div className={ss.achievement_card}>
                                <span className={ss.achievement_icon}>🌟</span>
                                <h3>Rising Star</h3>
                                <p>300% growth in followers</p>
                            </div>
                            <div className={ss.achievement_card}>
                                <span className={ss.achievement_icon}>💫</span>
                                <h3>Trend Setter</h3>
                                <p>Created 3 trending posts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard 